const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Please provide the question text'],
            trim: true,
        },
        keywords: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        answer: {
            type: String,
            required: [true, 'Please provide the answer text'],
            trim: true,
        },
        category: {
            type: String,
            enum: ['general', 'payment', 'technical', 'courses', 'account', 'chemistry'],
            default: 'general',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('FAQ', faqSchema);