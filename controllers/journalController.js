const Journal = require('../models/Journal');
const User = require('../models/User');

const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const getBadge = (user, badgeName) => {
    if (!user.badges.includes(badgeName)) {
        user.badges.push(badgeName);
        return true;
    }
    return false;
};

exports.createJournal = async (req, res) => {
    const { content, mood, timeTaken } = req.body;

    try {
        const user = await User.findById(req.user._id);
        const today = new Date();

        if (user.lastJournalDate && isSameDay(new Date(user.lastJournalDate), today)) {
            return res.status(400).json({ message: 'You have already journaled today. Come back tomorrow!' });
        }

        let streak = user.streak;
        const lastDate = user.lastJournalDate ? new Date(user.lastJournalDate) : null;
        let newBadges = [];
        let usedFreezer = false;

        // Streak Logic
        if (lastDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (isSameDay(lastDate, yesterday)) {
                streak += 1;
            } else {
                // Missed a day
                if (user.streakFreezers > 0) {
                    user.streakFreezers -= 1;
                    streak += 1; // Saved by freezer!
                    usedFreezer = true;
                } else {
                    streak = 1;
                }
            }
        } else {
            streak = 1;
        }

        // Update Growth Stage
        let growthStage = 'Seed';
        if (streak >= 30) growthStage = 'Forest';
        else if (streak >= 14) growthStage = 'Tree';
        else if (streak >= 7) growthStage = 'Plant';
        else if (streak >= 3) growthStage = 'Sprout';

        // Create Journal
        const journal = await Journal.create({
            user: req.user._id,
            content,
            mood,
            timeTaken,
            date: today
        });

        user.streak = streak;
        user.growthStage = growthStage;
        user.lastJournalDate = today;
        user.totalJournals += 1;
        user.journalPoints += 10;

        // Badges
        if (user.totalJournals === 1) {
            if (getBadge(user, 'First Step')) newBadges.push('First Step');
        }
        if (streak >= 7) {
            if (getBadge(user, 'Week Warrior')) newBadges.push('Week Warrior');
        }
        if (streak >= 30) {
            if (getBadge(user, 'Consistency King')) newBadges.push('Consistency King');
        }
        if (user.totalJournals >= 50) {
            if (getBadge(user, 'Journal Master')) newBadges.push('Journal Master');
        }

        await user.save();

        res.status(201).json({
            journal,
            newBadges,
            usedFreezer,
            currentPoints: user.journalPoints,
            streak: user.streak
        });
    } catch (error) {
        console.error(error); // Log internal errors
        res.status(500).json({ message: error.message });
    }
};

exports.getJournals = async (req, res) => {
    try {
        const journals = await Journal.find({ user: req.user._id }).sort({ date: -1 });
        res.json(journals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const journals = await Journal.find({ user: req.user._id });

        // Calculate mood counts
        const moodCounts = journals.reduce((acc, journal) => {
            acc[journal.mood] = (acc[journal.mood] || 0) + 1;
            return acc;
        }, {});

        // Prepare data for charts with weather mapping
        const weatherMap = {
            'Happy': 'Sunny',
            'Calm': 'Cloudy', // or 'Clear'
            'Sad': 'Rainy',
            'Angry': 'Stormy'
        };

        const moodData = Object.keys(moodCounts).map(mood => ({
            name: mood,
            value: moodCounts[mood],
            weather: weatherMap[mood] || 'Unknown'
        }));

        res.json({
            totalJournals: journals.length,
            moodData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.buyItem = async (req, res) => {
    const { itemId } = req.body;
    try {
        const user = await User.findById(req.user._id);

        if (itemId === 'streak-freezer') {
            if (user.journalPoints >= 50) {
                user.journalPoints -= 50;
                user.streakFreezers += 1;
                await user.save();
                res.json({ success: true, message: 'Purchased Streak Freezer!', streakFreezers: user.streakFreezers, points: user.journalPoints });
            } else {
                res.status(400).json({ message: 'Not enough points (Need 50)' });
            }
        } else {
            res.status(400).json({ message: 'Invalid Item' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteJournal = async (req, res) => {
    try {
        const journal = await Journal.findById(req.params.id);

        if (!journal) {
            return res.status(404).json({ message: 'Journal not found' });
        }

        if (journal.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user._id);

        // If deleting today's journal, allow them to write again
        if (user.lastJournalDate && isSameDay(new Date(user.lastJournalDate), new Date(journal.date))) {
            // Revert to yesterday or null to allow writing again today
            // Ideally we find the previous journal, but setting to null or yesterday works enough to unlock Dashboard.
            // Best: Find the previous journal date.
            const prevJournal = await Journal.findOne({
                user: user._id,
                _id: { $ne: journal._id }
            }).sort({ date: -1 });

            user.lastJournalDate = prevJournal ? prevJournal.date : null;
        }

        user.totalJournals = Math.max(0, user.totalJournals - 1);
        user.journalPoints = Math.max(0, user.journalPoints - 10);
        await user.save();

        await journal.deleteOne();

        res.json({ message: 'Journal removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
