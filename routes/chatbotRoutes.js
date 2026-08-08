const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth/authController');
const chatbotController = require('../controllers/chatbotController');

router.use(authController.protect);

// أي مستخدم مسجل دخول يقدر يسأل
router.post('/ask', chatbotController.askChatbot);

// الأدمن بس يقدر يدير الأسئلة الشائعة
router.use(authController.allowedTo('admin'));

router
    .route('/faqs')
    .get(chatbotController.getAllFAQs)
    .post(chatbotController.createFAQ);

router
    .route('/faqs/:id')
    .get(chatbotController.getFAQ)
    .patch(chatbotController.updateFAQ)
    .delete(chatbotController.deleteFAQ);

module.exports = router;