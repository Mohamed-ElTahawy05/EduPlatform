const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const questionController = require('../controllers/questionController');

router
    .route('/')
    .get(questionController.getAllQuestions)
    .post(
        authController.protect,
        authController.allowedTo('admin'),
        questionController.createQuestion
    );

router
    .route('/:id')
    .get(questionController.getQuestion)
    .patch(
        authController.protect,
        authController.allowedTo('admin'),
        questionController.updateQuestion
    )
    .delete(
        authController.protect,
        authController.allowedTo('admin'),
        questionController.deleteQuestion
    );

module.exports = router;