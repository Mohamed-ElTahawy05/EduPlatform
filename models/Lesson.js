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
                if (!v) return true; // optional field, لو مش متبعوت مفيش مشكلة
                return /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/.test(v);
            },
            message: 'videoUrl must be a valid YouTube embed link (e.g. https://www.youtube.com/embed/VIDEO_ID)',
        },
    },
    pdf: {
        type: String,
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