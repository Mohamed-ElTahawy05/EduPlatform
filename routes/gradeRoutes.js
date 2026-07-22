const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const gradeController = require('../controllers/gradeController');

router.use(authController.protect);

router
    .route('/')
    .get(gradeController.getAllGrades)
    .post(
        authController.allowedTo('admin', 'teacher'),
        gradeController.createGrade
    );

router
    .route('/:id')
    .get(gradeController.getGrade)
    .patch(
        authController.allowedTo('admin', 'teacher'),
        gradeController.updateGrade
    )
    .delete(
        authController.allowedTo('admin', 'teacher'),
        gradeController.deleteGrade
    );

module.exports = router;