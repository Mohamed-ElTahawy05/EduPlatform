const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const questionController = require('../controllers/questionController');

router.use(authController.protect);

router
    .route('/')
    .get(questionController.getAllQuestions)
    .post(
        authController.allowedTo('admin', 'teacher'),
        questionController.createQuestion
    );

router
    .route('/:id')
    .get(questionController.getQuestion)
    .patch(
        authController.allowedTo('admin', 'teacher'),
        questionController.updateQuestion
    )
    .delete(
        authController.allowedTo('admin', 'teacher'),
        questionController.deleteQuestion
    );

module.exports = router;