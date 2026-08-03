const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const factory = require('../handlerFactory');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');

exports.createCourse = factory.createOne(Course);

const getLessonStatsMap = async () => {
    const stats = await Lesson.aggregate([
        { $match: { status: 'published' } },
        {
            $project: {
                course: 1,
                hasVideo: { $cond: [{ $ifNull: ['$videoUrl', false] }, 1, 0] },
            },
        },
        {
            $group: {
                _id: '$course',
                num_lec: { $sum: 1 },
                num_Video: { $sum: '$hasVideo' },
            },
        },
    ]);

    return new Map(stats.map((s) => [s._id.toString(), s]));
};

exports.getAllCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find();
    const lessonStatsMap = await getLessonStatsMap();

    const coursesWithStats = courses.map((course) => {
        const idStr = course._id.toString();
        const lessonStats = lessonStatsMap.get(idStr) || { num_lec: 0, num_Video: 0 };

        return {
            _id: course._id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail || null,
            grade: course.grade,
            teacher: course.teacher,
            views: course.views,
            num_lec: lessonStats.num_lec,
            num_Video: lessonStats.num_Video,
            createdAt: course.createdAt,
        };
    });

    res.status(200).json({
        status: 'success',
        results: coursesWithStats.length,
        data: {
            data: coursesWithStats,
        },
    });
});

exports.getCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate('lessons');

    if (!course) {
        return next(new ApiError('No document found with that ID', 404));
    }

    await Course.updateOne({ _id: course._id }, { $inc: { views: 1 } });

    const lessonStatsMap = await getLessonStatsMap();
    const idStr = course._id.toString();
    const lessonStats = lessonStatsMap.get(idStr) || { num_lec: 0, num_Video: 0 };

    const courseData = course.toObject();
    courseData.views = (course.views || 0) + 1;
    courseData.num_lec = lessonStats.num_lec;
    courseData.num_Video = lessonStats.num_Video;

    res.status(200).json({
        status: 'success',
        data: {
            data: courseData,
        },
    });
});

exports.updateCourse = factory.updateOne(Course);
exports.deleteCourse = factory.deleteOne(Course);