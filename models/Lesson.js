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
    },
},
{
    timestamps: true,
});

module.exports = mongoose.model('Lesson', lessonSchema);