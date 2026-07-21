const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const adminController = require('../controllers/user/adminController');

router.use(authController.protect);
router.use(authController.allowedTo('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/users', adminController.getAllUsers);

router.get('/users/:id', adminController.getUser);

router.delete('/users/:id', adminController.deleteUser);

router.get('/courses', adminController.getAllCourses);

router.delete('/courses/:id', adminController.deleteCourse);

router.get('/quiz-results', adminController.getAllQuizResults);

router.get('/reports', adminController.getReports);

module.exports = router;