const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const Enrollment = require('../../models/Enrollment');
const LessonProgress = require('../../models/LessonProgress');
const Quiz = require('../../models/Quiz');
const QuizResult = require('../../models/QuizResult');
const catchAsync = require('../../utils/catchAsync');

exports.getMyLessons = catchAsync(async (req, res, next) => {
    const studentId = req.user.id;
    const studentGrade = req.user.grade;

    const courses = await Course.find({ grade: studentGrade }).sort('createdAt');

    const enrollments = await Enrollment.find({ student: studentId }).select('course');
    const enrolledCourseIds = new Set(enrollments.map(e => e.course.toString()));

    const progressRecords = await LessonProgress.find({ student: studentId });
    const watchedLessonIds = new Set(progressRecords.map(p => p.lesson.toString()));

    const allQuizzes = await Quiz.find({ lesson: { $ne: null } });
    const quizByLessonId = new Map(allQuizzes.map(q => [q.lesson.toString(), q]));

    const quizResults = await QuizResult.find({ user: studentId, status: 'completed' }).select('quiz');
    const completedQuizIds = new Set(quizResults.map(r => r.quiz.toString()));

    const isLessonFullyCompleted = (lessonId) => {
        if (!watchedLessonIds.has(lessonId.toString())) return false;
        const quiz = quizByLessonId.get(lessonId.toString());
        if (!quiz) return true;
        return completedQuizIds.has(quiz._id.toString());
    };

    const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
            const lessons = await Lesson.find({
                course: course._id,
                status: 'published',
            }).sort('order createdAt');

            let previousCompleted = true; // أول درس مقفول بس بشرط الاشتراك، مش بشرط درس قبله

            const lessonsData = lessons.map((lesson) => {
                const completed = isLessonFullyCompleted(lesson._id);
                const locked = !previousCompleted;
                previousCompleted = completed;

                return {
                    _id: lesson._id,
                    title: lesson.title,
                    description: lesson.description,
                    duration: lesson.duration,
                    isFree: lesson.isFree,
                    completed,
                    locked,
                };
            });

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
        data: { continueWatching, courses: coursesWithLessons },
    });
});