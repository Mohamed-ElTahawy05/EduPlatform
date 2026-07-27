const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Upload } = require('@aws-sdk/lib-storage');
const b2Client = require('../utils/b2Client');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        const uniqueName = `${crypto.randomUUID()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 1024, // 1 جيجا حد أقصى
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

    const tempFilePath = req.file.path;
    const uniqueFileName = `lessons/${crypto.randomUUID()}-${req.file.originalname}`;

    try {
        const fileStream = fs.createReadStream(tempFilePath);

        const upload = new Upload({
            client: b2Client,
            params: {
                Bucket: process.env.B2_BUCKET_NAME,
                Key: uniqueFileName,
                Body: fileStream,
                ContentType: req.file.mimetype,
            },
        });

        await upload.done();

        const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${uniqueFileName}`;

        res.status(200).json({
            status: 'success',
            data: {
                videoUrl: fileUrl,
            },
        });
    } finally {
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });
    }
});