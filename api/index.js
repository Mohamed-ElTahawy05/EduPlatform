const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' }); // مش هتلاقيه على Vercel، لكن مش هيسبب مشكلة لأن المتغيرات مضبوطة من Vercel نفسه

const app = require('../app');

// في بيئة serverless، لازم نتأكد إن الاتصال بالداتابيز جاهز قبل ما نرد على أي طلب
// وبنعمل "cache" للاتصال عشان منفتحش اتصال جديد مع كل طلب (ده بيبطئ ويستهلك الموارد)
let cachedConnection = null;

const connectToDatabase = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI);
    return cachedConnection;
};

// الدالة دي هي اللي Vercel بينفذها مع كل طلب
module.exports = async (req, res) => {
    try {
        await connectToDatabase();
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        return res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
        });
    }

    return app(req, res);
};