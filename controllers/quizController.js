const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizResult = require('../models/QuizResult');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.createQuiz = factory.createOne(Quiz);
exports.getAllQuizzes = factory.getAll(Quiz);
exports.getQuiz = factory.getOne(Quiz);
exports.updateQuiz = factory.updateOne(Quiz);
exports.deleteQuiz = factory.deleteOne(Quiz);

// POST /api/v1/quizzes/:id/submit
exports.submitQuiz = catchAsync(async (req, res, next) => {
    const quizId = req.params.id;
    const { answers } = req.body; // [{ question: '<id>', selected: 2 }, ...]

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        return next(new ApiError('No quiz found with that ID', 404));
    }

    const questions = await Question.find({ quiz: quizId });
    if (questions.length === 0) {
        return next(new ApiError('This quiz has no questions yet', 400));
    }

    let score = 0;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    questions.forEach((q) => {
        const studentAnswer = (answers || []).find(a => a.question === q._id.toString());
        if (studentAnswer && studentAnswer.selected === q.correctAnswer) {
            score += q.marks;
        }
    });

    const percentage = totalMarks === 0 ? 0 : Math.round((score / totalMarks) * 100);

    const previousAttempts = await QuizResult.countDocuments({
        user: req.user.id,
        quiz: quizId,
    });

    const quizResult = await QuizResult.create({
        user: req.user.id,
        quiz: quizId,
        score,
        totalMarks,
        percentage,
        status: 'completed',
        attempt: previousAttempts + 1,
        submittedAt: Date.now(),
    });

    res.status(201).json({
        status: 'success',
        data: { quizResult },
    });
});

exports.getQuizResult = catchAsync(async (req, res, next) => {
    const quizResult = await QuizResult.findOne({
        user: req.user.id,
        quiz: req.params.id,
    }).sort('-submittedAt');

    if (!quizResult) {
        return next(new ApiError('You have not submitted this quiz yet', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { quizResult },
    });
});

exports.getMyQuizResults = catchAsync(async (req, res, next) => {
    const results = await QuizResult.find({ user: req.user.id }).populate({
        path: 'quiz',
        select: 'title course lesson',
    });

    res.status(200).json({
        status: 'success',
        results: results.length,
        data: { results },
    });
});