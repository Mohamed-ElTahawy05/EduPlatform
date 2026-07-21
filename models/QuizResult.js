const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },

    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
    type: Date,
    },
  },
{
    timestamps: true,
}
);

module.exports = mongoose.model("QuizResult", quizResultSchema);