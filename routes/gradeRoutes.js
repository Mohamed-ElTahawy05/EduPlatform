const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth/authController');
const gradeController = require('../controllers/gradeController');

router
    .route('/')
    .get(gradeController.getAllGrades)
    .post(
        authController.protect,
        authController.allowedTo('admin'),
        gradeController.createGrade
    );

router
    .route('/:id')
    .get(gradeController.getGrade)
    .patch(
        authController.protect,
        authController.allowedTo('admin'),
        gradeController.updateGrade
    )
    .delete(
        authController.protect,
        authController.allowedTo('admin'),
        gradeController.deleteGrade
    );

module.exports = router;