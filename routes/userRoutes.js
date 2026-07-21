const express = require('express');
const authController = require('../controllers/auth/authController');
const userController = require('../controllers/user/userController');

const router = express.Router();

router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

router.use(authController.allowedTo('admin'));
router.get('/getAllUsers', userController.getAllUsers);

module.exports = router;
