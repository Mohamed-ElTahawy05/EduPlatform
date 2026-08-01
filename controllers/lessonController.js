const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.createLesson = factory.createOne(Lesson);
exports.getAllLessons = factory.getAll(Lesson);
exports.updateLesson = factory.updateOne(Lesson);
exports.deleteLesson = factory.deleteOne(Lesson);

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

    // هل الطالب خلّص الدرس ده (فتح الفيديو + سلّم كويز الدرس)؟
    let solutionsUnlocked = isPrivileged;
    let quiz = null;

    if (!isPrivileged) {
        quiz = await Quiz.findOne({ lesson: lesson._id });

        if (!quiz) {
            // مفيش كويز مرتبط بالدرس أصلًا - الحل بيفضل ظاهر عادي
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
    if (!solutionsUnlocked) {
        delete lessonData.solutionsPdf;
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: lessonData,
            quiz: quiz ? { _id: quiz._id, title: quiz.title } : null,
            solutionsUnlocked,
        },
    });
});