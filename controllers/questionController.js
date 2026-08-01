const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.createQuestion = catchAsync(async (req, res, next) => {
    const quiz = await Quiz.findById(req.body.quiz);
    if (!quiz) {
        return next(new ApiError('No quiz found with that ID', 404));
    }

    const question = await Question.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { data: question },
    });
});

exports.getAllQuestions = factory.getAll(Question);
exports.getQuestion = factory.getOne(Question);
exports.updateQuestion = factory.updateOne(Question);
exports.deleteQuestion = factory.deleteOne(Question);