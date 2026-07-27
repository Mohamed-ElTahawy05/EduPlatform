const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const b2Client = require('../utils/b2Client');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// تخزين مؤقت في الـ RAM قبل ما نرفعه لـ B2 (مناسب لفيديوهات مش ضخمة جدًا)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // حد أقصى 500 ميجا للفيديو الواحد، عدّلها حسب احتياجك
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
            return cb(new ApiError('Please upload a video file only', 400), false);
        }
        cb(null, true);
    },
});

exports.uploadVideoMiddleware = upload.single('video');

exports.uploadVideoToB2 = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new ApiError('No video file provided', 400));
    }

    // اسم فريد للملف عشان منحصلش تعارض بين فيديوهات بنفس الاسم
    const uniqueFileName = `lessons/${crypto.randomUUID()}-${req.file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: uniqueFileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    });

    await b2Client.send(command);

    const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${uniqueFileName}`;

    res.status(200).json({
        status: 'success',
        data: {
            videoUrl: fileUrl,
        },
    });
});