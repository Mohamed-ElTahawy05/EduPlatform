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
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grade",
        required: [true, 'Course must belong to a Grade']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Course must belong to a Teacher']
    },views: {
    type: Number,
    default: 0
},
},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}); 

courseSchema.virtual('lessons', {
    ref: 'Lesson',
    foreignField: 'course',
    localField: '_id'
});

module.exports = mongoose.model('Course', courseSchema);