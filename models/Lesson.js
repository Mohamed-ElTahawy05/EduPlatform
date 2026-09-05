const mongoose = require('mongoose');

const videoValidator = function (v) {
    if (!v) return true;
    const isYoutubeEmbed = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/.test(v);
    const isCloudinaryVideo = v.startsWith('https://res.cloudinary.com/');
    return isYoutubeEmbed || isCloudinaryVideo;
};

const fileValidator = function (v) {
    if (!v) return true;
    const isCloudinary = v.startsWith('https://res.cloudinary.com/');
    return isCloudinary;
};

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the lesson'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description for the lesson'],
        trim: true,
    },
    duration: {
        type: String,
    },
    order: {
        type: Number,
        default: 0,
    },
    videoUrl: {
        type: String,
        validate: {
            validator: videoValidator,
            message: 'videoUrl must be a valid YouTube embed link or an uploaded video link',
        },
    },
    videos: [
        {
            type: String,
            validate: {
                validator: videoValidator,
                message: 'each video must be a valid YouTube embed link or an uploaded video link',
            },
        },
    ],
    summaryPdf: {
        type: String,
        validate: {
            validator: fileValidator,
            message: 'summaryPdf must be a valid uploaded file link',
        },
    },
    questionsPdf: {
        type: String,
        validate: {
            validator: fileValidator,
            message: 'questionsPdf must be a valid uploaded file link',
        },
    },
    solutionsPdf: {
        type: String,
        validate: {
            validator: fileValidator,
            message: 'solutionsPdf must be a valid uploaded file link',
        },
    },
    thumbnail: {
        type: String,
        validate: {
            validator: fileValidator,
            message: 'thumbnail must be a valid uploaded image link',
        },
    },
    isFree: {
        type: Boolean,
        default: false
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Please provide a course for the lesson'],
    },
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
},
{
    timestamps: true,
});

module.exports = mongoose.model('Lesson', lessonSchema);