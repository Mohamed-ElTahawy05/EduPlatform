const express = require('express');
const courseController = require('../controllers/course/courseController');
const authController = require('../controllers/auth/authController');

const router = express.Router();

router
    .route('/')
    .get(courseController.getAllCourses)
    .post(
        authController.protect,
        authController.allowedTo('admin'),
        courseController.createCourse
    );

router
    .route('/:id')
    .get(courseController.getCourse)
    .patch(
        authController.protect,
        authController.allowedTo('admin'),
        courseController.updateCourse
    )
    .delete(
        authController.protect,
        authController.allowedTo('admin'),
        courseController.deleteCourse
    );

module.exports = router;
