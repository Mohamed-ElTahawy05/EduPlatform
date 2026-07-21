const Lesson = require('../models/Lesson');
const factory = require('./handlerFactory');

exports.createLesson = factory.createOne(Lesson);
exports.getAllLessons = factory.getAll(Lesson);
exports.getLesson = factory.getOne(Lesson);
exports.updateLesson = factory.updateOne(Lesson);
exports.deleteLesson = factory.deleteOne(Lesson);