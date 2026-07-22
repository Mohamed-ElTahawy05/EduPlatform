const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const quizController = require('../controllers/quizController');

router.use(authController.protect);

router.get('/my/results', quizController.getMyQuizResults);

router
    .route('/')
    .get(quizController.getAllQuizzes)
    .post(
        authController.allowedTo('admin', 'teacher'),
        quizController.createQuiz
    );

router
    .route('/:id')
    .get(quizController.getQuiz)
    .patch(
        authController.allowedTo('admin', 'teacher'),
        quizController.updateQuiz
    )
    .delete(
        authController.allowedTo('admin', 'teacher'),
        quizController.deleteQuiz
    );

router.post('/:id/submit', quizController.submitQuiz);
router.get('/:id/result', quizController.getQuizResult);

module.exports = router;