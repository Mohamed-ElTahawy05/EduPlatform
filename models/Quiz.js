const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson"
    },
    totalMarks: {
        type: Number,
        default: 100
    },
    duration: {
        type: Number,
        required: true
    },
    NumberQuestions: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Quiz", quizSchema);