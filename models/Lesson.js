const mongoose = require('mongoose');

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
    videoUrl: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v) return true;
                const isYoutubeEmbed = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/.test(v);
                const isB2Video = v.startsWith(process.env.B2_ENDPOINT || '');
                return isYoutubeEmbed || isB2Video;
            },
            message: 'videoUrl must be a valid YouTube embed link or an uploaded video link',
        },
    },
    pdf: {
        type: String,
    },
    thumbnail: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return v.startsWith(process.env.B2_ENDPOINT || '');
            },
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
    },views: {
    type: Number,
    default: 0
    },status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
},
{
    timestamps: true,
});

module.exports = mongoose.model('Lesson', lessonSchema);