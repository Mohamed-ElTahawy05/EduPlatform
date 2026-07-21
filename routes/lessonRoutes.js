const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const lessonController = require('../controllers/lessonController');

router
    .route('/')
    .get(lessonController.getAllLessons)
    .post(
        authController.protect,
        authController.allowedTo('admin'),
        lessonController.createLesson
    );

router
    .route('/:id')
    .get(lessonController.getLesson)
    .patch(
        authController.protect,
        authController.allowedTo('admin'),
        lessonController.updateLesson
    )
    .delete(
        authController.protect,
        authController.allowedTo('admin'),
        lessonController.deleteLesson
    );

module.exports = router;