const express = require('express');
const router = express.Router();
const { createJournal, getJournals, getAnalytics, buyItem, deleteJournal } = require('../controllers/journalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createJournal)
    .get(protect, getJournals);

router.post('/buy', protect, buyItem);
router.get('/analytics', protect, getAnalytics);
router.delete('/:id', protect, deleteJournal);

module.exports = router;
