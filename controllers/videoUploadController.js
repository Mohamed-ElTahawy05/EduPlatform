const cloudinary = require('../utils/cloudinaryClient');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// endpoint واحد بيولد "توقيع" مؤقت، وانت بترفع بيه مباشرة على Cloudinary
// من غير ما الملف يعدي على سيرفرنا خالص (مهم جدًا على Vercel اللي بيحدد حجم الطلب بـ 4.5 ميجا بس)
exports.getUploadSignature = catchAsync(async (req, res, next) => {
    const { resourceType } = req.body; // 'video' أو 'image'

    if (!resourceType || !['video', 'image'].includes(resourceType)) {
        return next(new ApiError('resourceType must be either "video" or "image"', 400));
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = resourceType === 'video' ? 'edunest/videos' : 'edunest/thumbnails';

    // بنوقع بس الباراميترز اللي هنبعتها فعلاً وقت الرفع
    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
        status: 'success',
        data: {
            signature,
            timestamp,
            folder,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        },
    });
});