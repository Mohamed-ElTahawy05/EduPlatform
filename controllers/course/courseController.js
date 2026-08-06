const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const factory = require('../handlerFactory');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');

exports.createCourse = factory.createOne(Course);

// يحول "25:30" أو "1:05:30" لعدد ثواني
const parseDurationToSeconds = (durationStr) => {
    if (!durationStr || typeof durationStr !== 'string') return 0;

    const parts = durationStr.split(':').map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p))) return 0;

    if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
    }
    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
};

// يحول عدد الثواني لصيغة "H:MM:SS" أو "MM:SS"
const formatSecondsToDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
};

const countPdfs = (lesson) => {
    let count = 0;
    if (lesson.summaryPdf) count += 1;
    if (lesson.questionsPdf) count += 1;
    if (lesson.solutionsPdf) count += 1;
    return count;
};

const countVideos = (lesson) => {
    let count = 0;
    if (lesson.videoUrl) count += 1;
    if (Array.isArray(lesson.videos)) count += lesson.videos.length;
    return count;
};

// بيحسب num_lec, num_Video, num_pdf, totalDurationSeconds لكل كورس دفعة واحدة
const getLessonStatsMap = async () => {
    const lessons = await Lesson.find({ status: 'published' });

    const map = new Map();

    lessons.forEach((lesson) => {
        const courseId = lesson.course.toString();

        if (!map.has(courseId)) {
            map.set(courseId, {
                num_lec: 0,
                num_Video: 0,
                num_pdf: 0,
                totalDurationSeconds: 0,
            });
        }

        const entry = map.get(courseId);
        entry.num_lec += 1;
        entry.num_Video += countVideos(lesson);
        entry.num_pdf += countPdfs(lesson);
        entry.totalDurationSeconds += parseDurationToSeconds(lesson.duration);
    });

    return map;
};

exports.getAllCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find();
    const lessonStatsMap = await getLessonStatsMap();

    const coursesWithStats = courses.map((course) => {
        const idStr = course._id.toString();
        const stats = lessonStatsMap.get(idStr) || {
            num_lec: 0,
            num_Video: 0,
            num_pdf: 0,
            totalDurationSeconds: 0,
        };

        return {
            _id: course._id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail || null,
            grade: course.grade,
            teacher: course.teacher,
            views: course.views,
            num_lec: stats.num_lec,
            num_Video: stats.num_Video,
            num_pdf: stats.num_pdf,
            totalDuration: formatSecondsToDuration(stats.totalDurationSeconds),
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
    const stats = lessonStatsMap.get(idStr) || {
        num_lec: 0,
        num_Video: 0,
        num_pdf: 0,
        totalDurationSeconds: 0,
    };

    const courseData = course.toObject();
    courseData.views = (course.views || 0) + 1;
    courseData.num_lec = stats.num_lec;
    courseData.num_Video = stats.num_Video;
    courseData.num_pdf = stats.num_pdf;
    courseData.totalDuration = formatSecondsToDuration(stats.totalDurationSeconds);

    res.status(200).json({
        status: 'success',
        data: {
            data: courseData,
        },
    });
});

exports.updateCourse = factory.updateOne(Course);
exports.deleteCourse = factory.deleteOne(Course);