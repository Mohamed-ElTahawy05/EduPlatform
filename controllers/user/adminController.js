const User = require('../../models/User');
const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const LessonProgress = require('../../models/LessonProgress');
const QuizResult = require('../../models/QuizResult');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');

const ACTIVE_THRESHOLD_MINUTES = 15;

// GET /api/v1/admin/dashboard
exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const activeThreshold = new Date(Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000);

    const totalUsers = await User.countDocuments();

    const activeUsersNow = await User.countDocuments({
        lastActiveAt: { $gte: activeThreshold },
    });

    const totalLessons = await Lesson.countDocuments({ status: 'published' });

    const viewsAgg = await Lesson.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);
    const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

    const totalProgressRecords = await LessonProgress.countDocuments();
    const completionRate =
        totalUsers === 0 || totalLessons === 0
            ? 0
            : Math.round((totalProgressRecords / (totalUsers * totalLessons)) * 100);

    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 6 * 7);

    const weeklySignups = await User.aggregate([
        { $match: { createdAt: { $gte: sixWeeksAgo } } },
        {
            $group: {
                _id: {
                    $dateTrunc: { date: '$createdAt', unit: 'week', binSize: 1 },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const weeklyGrowth = [];
    for (let i = 5; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const matchingWeek = weeklySignups.find((w) => {
            const wDate = new Date(w._id);
            return (
                wDate.getFullYear() === weekStart.getFullYear() &&
                Math.abs(wDate - weekStart) < 7 * 24 * 60 * 60 * 1000
            );
        });

        weeklyGrowth.push({
            weekStart,
            newUsers: matchingWeek ? matchingWeek.count : 0,
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                totalUsers,
                activeUsers: activeUsersNow,
                totalLessons,
                totalViews,
                completionRate,
            },
            userGrowth: weeklyGrowth,
        },
    });
});

// GET /api/v1/admin/users
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const activeThreshold = new Date(Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000);

    const users = await User.find().populate({ path: 'grade', select: 'name' });

    // نضيف isOnline لكل مستخدم (نفس منطق النشاط في الداشبورد)
    const usersWithStatus = users.map((user) => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    grade: user.grade,
    role: user.role,
    isOnline: user.lastActiveAt ? user.lastActiveAt >= activeThreshold : false,
    createdAt: user.createdAt,
    }));

    res.status(200).json({
        status: 'success',
        results: usersWithStatus.length,
        data: {
            users: usersWithStatus,
        },
    });
});

// GET /api/v1/admin/users/:id
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate({ path: 'grade', select: 'name' });

    if (!user) {
        return next(new ApiError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// DELETE /api/v1/admin/users/:id
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new ApiError('No user found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// GET /api/v1/admin/courses
exports.getAllCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find()
        .populate({ path: 'grade', select: 'name' })

    const lessonsCounts = await Lesson.aggregate([
        { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);
    const countsMap = new Map(
        lessonsCounts.map((item) => [item._id.toString(), item.count])
    );

    const coursesWithCounts = courses.map((course) => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail || null,
        grade: course.grade,
        teacher: course.teacher,
        views: course.views,
        lessonsCount: countsMap.get(course._id.toString()) || 0,
        createdAt: course.createdAt,
    }));

    // نجمع الكورسات تحت كل صف دراسي، عشان صاحبي في الفرونت يقدر يعرضهم مجمعين
    const gradesMap = new Map();

    coursesWithCounts.forEach((course) => {
        // ممكن يكون فيه كورس قديم بـ grade محذوف/مش موجود، نتعامل معاه كـ "بدون صف"
        const gradeKey = course.grade ? course.grade._id.toString() : 'no-grade';
        const gradeName = course.grade ? course.grade.name : 'بدون صف';

        if (!gradesMap.has(gradeKey)) {
            gradesMap.set(gradeKey, {
                gradeId: course.grade ? course.grade._id : null,
                gradeName,
                courses: [],
            });
        }

        gradesMap.get(gradeKey).courses.push(course);
    });

    const groupedByGrade = Array.from(gradesMap.values());

    res.status(200).json({
        status: 'success',
        results: coursesWithCounts.length,
        data: {
            grades: groupedByGrade,
        },
    });
});

// DELETE /api/v1/admin/courses/:id
exports.deleteCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
        return next(new ApiError('No course found with that ID', 404));
    }

    // مسح كل الدروس التابعة للكورس ده كمان (تنظيف تلقائي)
    await Lesson.deleteMany({ course: req.params.id });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// GET /api/v1/admin/quiz-results
exports.getAllQuizResults = catchAsync(async (req, res, next) => {
    const results = await QuizResult.find()
        .populate({ path: 'user', select: 'firstName lastName phone' })
        .populate({ path: 'quiz', select: 'title totalMarks' })
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: results.length,
        data: {
            quizResults: results,
        },
    });
});

// GET /api/v1/admin/reports
exports.getReports = catchAsync(async (req, res, next) => {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const publishedLessons = await Lesson.countDocuments({ status: 'published' });
    const totalQuizResults = await QuizResult.countDocuments();

    const usersByGrade = await User.aggregate([
        { $group: { _id: '$grade', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            summary: {
                totalUsers,
                totalCourses,
                totalLessons,
                publishedLessons,
                totalQuizResults,
            },
            usersByGrade,
        },
    });
});