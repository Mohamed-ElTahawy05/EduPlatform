const Course = require('../../models/Course');
const factory = require('../handlerFactory');

exports.createCourse = factory.createOne(Course);
exports.getAllCourses = factory.getAll(Course, { path: 'teacher', select: 'name email' });
exports.getCourse = factory.getOne(Course, { path: 'lessons' });
exports.updateCourse = factory.updateOne(Course);
exports.deleteCourse = factory.deleteOne(Course);