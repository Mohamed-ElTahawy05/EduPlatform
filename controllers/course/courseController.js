const Course = require('../../models/Course');
const factory = require('../handlerFactory');
const catchAsync = require('../../utils/catchAsync');

exports.createCourse = factory.createOne(Course);
exports.getAllCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find();

    res.status(200).json({
        status: "success",
        results: courses.length,
        data: {
            data: courses
        }
    });
});
exports.getCourse = factory.getOne(Course, { path: 'lessons' }, 'views');
exports.updateCourse = factory.updateOne(Course);
exports.deleteCourse = factory.deleteOne(Course);