const Course = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');

// POST /api/v1/courses/:id/enroll
exports.enrollInCourse = catchAsync(async (req, res, next) => {
    const courseId = req.params.id;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
        return next(new ApiError('No course found with that ID', 404));
    }

    // تأكد إن الطالب مش مشترك خلاص في نفس الكورس
    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) {
        return next(new ApiError('You are already enrolled in this course', 400));
    }

    const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
    });

    res.status(201).json({
        status: 'success',
        data: {
            enrollment,
        },
    });
});

// GET /api/v1/courses/my-enrollments
exports.getMyEnrollments = catchAsync(async (req, res, next) => {
    const enrollments = await Enrollment.find({ student: req.user.id }).populate('course');

    res.status(200).json({
        status: 'success',
        results: enrollments.length,
        data: {
            enrollments,
        },
    });
});