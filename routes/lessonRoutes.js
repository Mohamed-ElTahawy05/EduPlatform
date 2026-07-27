const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const lessonController = require('../controllers/lessonController');
const videoUploadController = require('../controllers/videoUploadController');

router.use(authController.protect);

router.post(
    '/upload-video',
    authController.allowedTo('admin', 'teacher'),
    videoUploadController.uploadVideoMiddleware,
    videoUploadController.uploadVideoToB2
);

router
    .route('/')
    .get(lessonController.getAllLessons)
    .post(
        authController.allowedTo('admin', 'teacher'),
        lessonController.createLesson
    );

router
    .route('/:id')
    .get(lessonController.getLesson)
    .patch(
        authController.allowedTo('admin', 'teacher'),
        lessonController.updateLesson
    )
    .delete(
        authController.allowedTo('admin', 'teacher'),
        lessonController.deleteLesson
    );

module.exports = router;