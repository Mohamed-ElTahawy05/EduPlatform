const express = require('express');
const courseController = require('../controllers/course/courseController');
const enrollmentController = require('../controllers/course/enrollmentController');
const authController = require('../controllers/auth/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/my-enrollments', enrollmentController.getMyEnrollments);

router
    .route('/')
    .get(courseController.getAllCourses)
    .post(
        authController.allowedTo('admin', 'teacher'),
        courseController.createCourse
    );

router.post('/:id/enroll', enrollmentController.enrollInCourse);

router
    .route('/:id')
    .get(courseController.getCourse)
    .patch(
        authController.allowedTo('admin', 'teacher'),
        courseController.updateCourse
    )
    .delete(
        authController.allowedTo('admin', 'teacher'),
        courseController.deleteCourse
    );

module.exports = router;