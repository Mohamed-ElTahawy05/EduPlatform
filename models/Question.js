const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true
    },
    marks: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model("Question", questionSchema);