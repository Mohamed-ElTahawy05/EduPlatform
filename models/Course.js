const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the course'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description for the course'],
        trim: true,
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grade",
        required: [true, 'Course must belong to a Grade']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Course must belong to a Teacher']
    }
},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}); 

// Virtual populate for lessons
courseSchema.virtual('lessons', {
    ref: 'Lesson',
    foreignField: 'course',
    localField: '_id'
});

module.exports = mongoose.model('Course', courseSchema);