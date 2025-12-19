const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    timeTaken: {
        type: Number, // in seconds or minutes
        default: 0
    },
    tags: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Journal', JournalSchema);
