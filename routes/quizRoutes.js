const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const quizController = require('../controllers/quizController');

router
    .route('/')
    .get(quizController.getAllQuizzes)
    .post(
        authController.protect,
        authController.allowedTo('admin'),
        quizController.createQuiz
    );

router
    .route('/:id')
    .get(quizController.getQuiz)
    .patch(
        authController.protect,
        authController.allowedTo('admin'),
        quizController.updateQuiz
    )
    .delete(
        authController.protect,
        authController.allowedTo('admin'),
        quizController.deleteQuiz
    );

router.post(
    '/:id/submit',
    authController.protect,
    quizController.submitQuiz
);

router.get(
    '/:id/result',
    authController.protect,
    quizController.getQuizResult
);

router.get(
    '/my/results',
    authController.protect,
    quizController.getMyQuizResults
);

module.exports = router;