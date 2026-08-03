const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.createLesson = require('./handlerFactory').createOne(Lesson);
exports.updateLesson = require('./handlerFactory').updateOne(Lesson);
exports.deleteLesson = require('./handlerFactory').deleteOne(Lesson);

const countPdfs = (lesson) => {
    let count = 0;
    if (lesson.summaryPdf) count += 1;
    if (lesson.questionsPdf) count += 1;
    if (lesson.solutionsPdf) count += 1;
    return count;
};

// GET /api/v1/lessons
exports.getAllLessons = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.courseId) filter = { course: req.params.courseId };

    const lessons = await Lesson.find(filter);

    const quizCounts = await Quiz.aggregate([
        { $match: { lesson: { $in: lessons.map((l) => l._id) } } },
        { $group: { _id: '$lesson', count: { $sum: 1 } } },
    ]);
    const quizCountMap = new Map(quizCounts.map((q) => [q._id.toString(), q.count]));

    const lessonsWithStats = lessons.map((lesson) => {
        const lessonObj = lesson.toObject();
        lessonObj.num_pdf = countPdfs(lesson);
        lessonObj.num_Quiz = quizCountMap.get(lesson._id.toString()) || 0;
        return lessonObj;
    });

    res.status(200).json({
        status: 'success',
        results: lessonsWithStats.length,
        data: {
            data: lessonsWithStats,
        },
    });
});

// GET /api/v1/lessons/:id
exports.getLesson = catchAsync(async (req, res, next) => {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
        return next(new ApiError('No document found with that ID', 404));
    }

    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');

    if (!isPrivileged && !lesson.isFree) {
        const enrollment = await Enrollment.findOne({
            student: req.user.id,
            course: lesson.course,
        });

        if (!enrollment) {
            return next(
                new ApiError('You must enroll in this course to access this lesson', 403)
            );
        }
    }

    await Lesson.updateOne({ _id: lesson._id }, { $inc: { views: 1 } });
    lesson.views = (lesson.views || 0) + 1;

    if (!isPrivileged) {
        const alreadyExists = await LessonProgress.findOne({
            student: req.user.id,
            lesson: lesson._id,
        });

        if (!alreadyExists) {
            await LessonProgress.create({
                student: req.user.id,
                lesson: lesson._id,
                course: lesson.course,
            });
        }
    }

    const quiz = await Quiz.findOne({ lesson: lesson._id });

    let solutionsUnlocked = isPrivileged;

    if (!isPrivileged) {
        if (!quiz) {
            solutionsUnlocked = true;
        } else {
            const quizResult = await QuizResult.findOne({
                user: req.user.id,
                quiz: quiz._id,
                status: 'completed',
            });
            solutionsUnlocked = !!quizResult;
        }
    }

    const lessonData = lesson.toObject();
    lessonData.num_pdf = countPdfs(lesson);
    lessonData.num_Quiz = quiz ? 1 : 0;

    if (!solutionsUnlocked) {
        delete lessonData.solutionsPdf;
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: lessonData,
            quiz: quiz ? { _id: quiz._id, title: quiz.title, duration: quiz.duration, NumberQuestions: quiz.NumberQuestions } : null,
            solutionsUnlocked,
        },
    });
});