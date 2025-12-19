const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    streak: {
        type: Number,
        default: 0
    },
    lastJournalDate: {
        type: Date
    },
    journalPoints: {
        type: Number,
        default: 0
    },
    growthStage: {
        type: String,
        enum: ['Seed', 'Sprout', 'Plant', 'Tree', 'Forest'],
        default: 'Seed'
    },
    totalJournals: {
        type: Number,
        default: 0
    },
    badges: {
        type: [String],
        default: []
    },
    streakFreezers: {
        type: Number,
        default: 0
    }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
