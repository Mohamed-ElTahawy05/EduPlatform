const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Grade name is required'],
            unique: true,
            trim: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual populate for courses
gradeSchema.virtual('courses', {
    ref: 'Course',
    foreignField: 'grade',
    localField: '_id'
});

gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Grade', gradeSchema);