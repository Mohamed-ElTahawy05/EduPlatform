const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const b2Client = require('../utils/b2Client');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getUploadUrl = catchAsync(async (req, res, next) => {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
        return next(new ApiError('Please provide fileName and fileType', 400));
    }

    const isVideo = fileType.startsWith('video/');
    const isImage = fileType.startsWith('image/');

    if (!isVideo && !isImage) {
        return next(new ApiError('fileType must be a video or image type', 400));
    }

    const folder = isVideo ? 'lessons' : 'thumbnails';
    const uniqueFileName = `${folder}/${crypto.randomUUID()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: uniqueFileName,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(b2Client, command, { expiresIn: 3600 });

    const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${uniqueFileName}`;

    res.status(200).json({
        status: 'success',
        data: {
            uploadUrl,
            fileUrl,
        },
    });
});