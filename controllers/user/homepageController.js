const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const Enrollment = require('../../models/Enrollment');
const LessonProgress = require('../../models/LessonProgress');
const catchAsync = require('../../utils/catchAsync');

// GET /api/v1/user/homepage
exports.getHomepage = catchAsync(async (req, res, next) => {
    const studentId = req.user.id;

    // 1) هات كل الكورسات اللي الطالب مشترك فيها
    const enrollments = await Enrollment.find({ student: studentId }).select('course');
    const enrolledCourseIds = enrollments.map(e => e.course);

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

    res.status(200).json({
        status: 'success',
        data: {
            welcomeMessage: `أهلًا يا ${req.user.name}`,
            today: new Date(),
            stats: {
                totalLessons: totalPublished,
                completedLessons: completedCount,
                remainingLessons: remainingCount,
                comingSoonLessons: comingSoonCount,
                progressPercentage,
            },
        },
    });
});