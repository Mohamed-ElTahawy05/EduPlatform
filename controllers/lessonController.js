const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
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

    // زيادة عداد المشاهدات (نفس منطق الـ views اللي كان شغال قبل كده)
    await Lesson.updateOne({ _id: lesson._id }, { $inc: { views: 1 } });
    lesson.views = (lesson.views || 0) + 1;

    // تسجيل تقدم الطالب أوتوماتيك (بس لو الطالب هو اللي بيفتح، مش أدمن/مدرس)
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'teacher') {
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

    res.status(200).json({
        status: 'success',
        data: {
            data: lesson,
        },
    });
});