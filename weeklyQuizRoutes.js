const express = require('express');
const router = express.Router();
const WeeklyQuiz = require('../modules/others/weeklyQuizSchema'); // আপনার WeeklyQuiz মডেলের সঠিক পাথ দিন
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus'); // আপনার মিডলওয়্যারের পাথ
const User = require('../modules/user/userSchema'); // User মডেলের পাথ

// মিডলওয়্যার যা সব রাউটে প্রযোজ্য হবে
router.use(passport.authenticate('jwt', { session: false }), checkUserStatus);

// 1. Create a new weekly quiz (শুধুমাত্র অ্যাডমিন বা মেন্টরদের জন্য)
router.post('/', async (req, res) => {
    try {
        // এখানে আপনি অ্যাডমিন বা মেন্টর চেক করার জন্য একটি লজিক যোগ করতে পারেন
        // if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

        const newQuiz = new WeeklyQuiz(req.body);
        const savedQuiz = await newQuiz.save();
        res.status(201).json({ message: 'Weekly quiz created successfully', quiz: savedQuiz });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 2. Get all weekly quizzes
router.get('/', async (req, res) => {
    try {
        const quizzes = await WeeklyQuiz.find().populate('questions').sort({ testDate: -1 });
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. Get a single quiz by ID
router.get('/:id', async (req, res) => {
    try {
        const quiz = await WeeklyQuiz.findById(req.params.id)
            .populate('questions')
            .populate('leaderboard.studentId', 'username image'); // লিডারবোর্ডে থাকা ছাত্রের নাম ও ছবি দেখানোর জন্য

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. Update a quiz by ID (শুধুমাত্র অ্যাডমিন বা মেন্টরদের জন্য)
router.put('/:id', async (req, res) => {
    try {
        const updatedQuiz = await WeeklyQuiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedQuiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz updated successfully', quiz: updatedQuiz });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 5. Delete a quiz by ID (শুধুমাত্র অ্যাডমিন বা মেন্টরদের জন্য)
router.delete('/:id', async (req, res) => {
    try {
        const deletedQuiz = await WeeklyQuiz.findByIdAndDelete(req.params.id);
        if (!deletedQuiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;