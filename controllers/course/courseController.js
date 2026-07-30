const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const factory = require('../handlerFactory');
const catchAsync = require('../../utils/catchAsync');

exports.createCourse = factory.createOne(Course);

exports.getAllCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find();

    const lessonsCounts = await Lesson.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
        lessonsCounts.map((item) => [item._id.toString(), item.count])
    );

    const coursesWithLessonsCount = courses.map((course) => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail || null,
        grade: course.grade,
        teacher: course.teacher,
        views: course.views,
        lessonsCount: countsMap.get(course._id.toString()) || 0,
        createdAt: course.createdAt,
    }));

    res.status(200).json({
        status: "success",
        results: coursesWithLessonsCount.length,
        data: {
            data: coursesWithLessonsCount
        }
    });
});

exports.getCourse = factory.getOne(Course, { path: 'lessons' }, 'views');
exports.updateCourse = factory.updateOne(Course);
exports.deleteCourse = factory.deleteOne(Course);