const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const Enrollment = require('../../models/Enrollment');
const LessonProgress = require('../../models/LessonProgress');
const catchAsync = require('../../utils/catchAsync');

// GET /api/v1/user/my-lessons
exports.getMyLessons = catchAsync(async (req, res, next) => {
    const studentId = req.user.id;
    const studentGrade = req.user.grade;

    // 1) هات كل الكورسات (الأبواب) بتاعة صف الطالب
    const courses = await Course.find({ grade: studentGrade }).sort('createdAt');

    // 2) هات الكورسات اللي الطالب مشترك فيها فعلاً
    const enrollments = await Enrollment.find({ student: studentId }).select('course');
    const enrolledCourseIds = new Set(enrollments.map(e => e.course.toString()));

    // 3) هات كل سجلات تقدم الطالب مرة واحدة (بدل ما نسأل الداتابيز جوه اللوب)
    const progressRecords = await LessonProgress.find({ student: studentId });
    const completedLessonIds = new Set(progressRecords.map(p => p.lesson.toString()));

    // 4) لكل كورس، هات دروسه المنشورة وحدد حالة كل درس
    const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
            const lessons = await Lesson.find({
                course: course._id,
                status: 'published',
            }).sort('createdAt');

            const lessonsData = lessons.map(lesson => ({
                _id: lesson._id,
                title: lesson.title,
                duration: lesson.duration,
                isFree: lesson.isFree,
                completed: completedLessonIds.has(lesson._id.toString()),
            }));

            const completedCount = lessonsData.filter(l => l.completed).length;

            return {
                _id: course._id,
                title: course.title,
                description: course.description,
                locked: !enrolledCourseIds.has(course._id.toString()),
                totalLessons: lessonsData.length,
                completedLessons: completedCount,
                lessons: lessonsData,
            };
        })
    );

    // 5) كارت "استكمال المشاهدة" = آخر درس فتحه الطالب (الأحدث زمنيًا)
    let continueWatching = null;
    if (progressRecords.length > 0) {
        const latestProgress = progressRecords.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        const lastLesson = await Lesson.findById(latestProgress.lesson);
        const lastCourse = lastLesson ? await Course.findById(lastLesson.course) : null;

        if (lastLesson && lastCourse) {
            continueWatching = {
                lessonId: lastLesson._id,
                lessonTitle: lastLesson.title,
                courseId: lastCourse._id,
                courseTitle: lastCourse.title,
                lastOpenedAt: latestProgress.createdAt,
            };
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            continueWatching,
            courses: coursesWithLessons,
        },
    });
});