const mongoose = require('mongoose');

const videoValidator = {
    validator: function (v) {
        if (!v) return true;
        const isYoutubeEmbed = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/.test(v);
        const isB2Video = v.startsWith(process.env.B2_ENDPOINT || '');
        return isYoutubeEmbed || isB2Video;
    },
    message: 'introVideo must be a valid YouTube embed link or an uploaded video link',
};

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
                const isB2 = v.startsWith(process.env.B2_ENDPOINT || '');
                const isCloudinary = v.startsWith('https://res.cloudinary.com/');
                return isB2 || isCloudinary;
            },
            message: 'thumbnail must be a valid uploaded image link',
        },
    },
    introVideo: {
        type: String,
        validate: videoValidator,
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grade",
        required: [true, 'Course must belong to a Grade']
    },
    views: {
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