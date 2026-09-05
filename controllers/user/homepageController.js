const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const Enrollment = require('../../models/Enrollment');
const LessonProgress = require('../../models/LessonProgress');
const catchAsync = require('../../utils/catchAsync');

// GET /api/v1/user/homepage
exports.getHomepage = catchAsync(async (req, res, next) => {
    const studentId = req.user.id;
    const studentGrade = req.user.grade;

    // 1) هات كل الكورسات اللي الطالب مشترك فيها
    const enrollments = await Enrollment.find({ student: studentId }).select('course');
    const enrolledCourseIds = enrollments.map(e => e.course);
    const enrolledCourseIdsSet = new Set(enrolledCourseIds.map(id => id.toString()));

    // 2) هات كل الدروس (lessons) اللي تتبع الكورسات دي
    const allLessons = await Lesson.find({ course: { $in: enrolledCourseIds } });

    const publishedLessons = allLessons.filter(l => l.status === 'published');
    const comingSoonLessons = allLessons.filter(l => l.status === 'draft');

    const publishedLessonIds = publishedLessons.map(l => l._id.toString());

    // 3) هات كل سجلات تقدم الطالب اللي بتخص الدروس المنشورة دي بس
    const progressRecords = await LessonProgress.find({
        student: studentId,
        lesson: { $in: publishedLessonIds },
    });

    const completedCount = progressRecords.length;
    const totalPublished = publishedLessons.length;
    const remainingCount = totalPublished - completedCount;
    const comingSoonCount = comingSoonLessons.length;

    const progressPercentage =
        totalPublished === 0 ? 0 : Math.round((completedCount / totalPublished) * 100);

    // 4) آخر 5 فيديوهات (دروس) اتضافت لكورسات نفس صف الطالب، سواء مشترك فيها أو لأ
    // أولًا هات كل الكورسات بتاعة الصف ده
    const gradeCourses = await Course.find({ grade: studentGrade }).select('_id');
    const gradeCourseIds = gradeCourses.map(c => c._id);

    const latestLessons = await Lesson.find({
        course: { $in: gradeCourseIds },
        status: 'published',
    })
        .sort('-createdAt')
        .limit(5)
        .populate({ path: 'course', select: 'title' });

    const latestVideos = latestLessons.map(lesson => ({
        _id: lesson._id,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        isFree: lesson.isFree,
        courseId: lesson.course ? lesson.course._id : null,
        courseTitle: lesson.course ? lesson.course.title : null,
        locked: !enrolledCourseIdsSet.has(lesson.course ? lesson.course._id.toString() : ''),
        createdAt: lesson.createdAt,
    }));

    res.status(200).json({
        status: 'success',
        data: {
            welcomeMessage: `أهلًا يا ${req.user.firstName}`,
            today: new Date(),
            stats: {
                totalLessons: totalPublished,
                completedLessons: completedCount,
                remainingLessons: remainingCount,
                comingSoonLessons: comingSoonCount,
                progressPercentage,
            },
            latestVideos,
        },
    });
});