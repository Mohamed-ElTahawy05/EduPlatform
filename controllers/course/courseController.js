const Course = require('../../models/Course');
const factory = require('../handlerFactory');
const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');

exports.createCourse = factory.createOne(Course);
exports.getAllCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find();

    const course = courses[0];

    const teacher = await User.findById(course.teacher);

    console.log("COURSE TEACHER ID:", course.teacher);
    console.log("FOUND TEACHER:", teacher);

    res.status(200).json({
        status: "success",
        data: {
            data: courses
        }
    });
});
exports.getCourse = factory.getOne(Course, { path: 'lessons' });
exports.updateCourse = factory.updateOne(Course);
exports.deleteCourse = factory.deleteOne(Course);