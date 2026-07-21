const Grade = require('../models/Grade');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.createGrade = factory.createOne(Grade);
exports.getGrade = factory.getOne(Grade, { path: 'courses' });
exports.updateGrade = factory.updateOne(Grade);
exports.deleteGrade = factory.deleteOne(Grade);

exports.getAllGrades = catchAsync(async (req, res, next) => {
    const grades = await Grade.find().populate({
        path: 'courses',
        populate: [
            { path: 'teacher', select: 'name familyName' },
            { path: 'lessons' }
        ]
    });

    res.status(200).json({
        status: 'success',
        results: grades.length,
        data: {
            grades
        }
    });
});