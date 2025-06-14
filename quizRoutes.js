const express = require('express');
const router = express.Router();
const WeeklyQuiz = require('../models/WeeklyQuiz');
const Class = require('../models/Class');
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');

// Create Weekly Quiz (Admin/Mentor)
router.post('/', 
    passport.authenticate('jwt', { session: false }), 
    checkUserStatus,
    async (req, res) => {
        try {
            if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { testName, questions, testDescription, testDate, testDuration, startTime, endTime, classId } = req.body;

            // Validate class exists and user is mentor/admin of the class
            const classData = await Class.findOne({
                _id: classId,
                $or: [
                    { mentors: req.user._id },
                    { createdBy: req.user._id }
                ]
            });

            if (!classData) {
                return res.status(403).json({ message: 'Unauthorized or class not found' });
            }

            const newQuiz = new WeeklyQuiz({
                testName,
                questions,
                testDescription,
                testDate,
                testDuration,
                startTime,
                endTime,
                class: classId,
                createdBy: req.user._id
            });

            await newQuiz.save();

            res.status(201).json(newQuiz);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
);

// Get All Quizzes for a Class
router.get('/class/:classId', async (req, res) => {
    try {
        const quizzes = await WeeklyQuiz.find({ class: req.params.classId })
            .populate('questions')
            .populate('leaderboard.studentId', 'username email image')
            .sort({ testDate: -1 });

        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Get Quiz by ID
router.get('/:id', async (req, res) => {
    try {
        const quiz = await WeeklyQuiz.findById(req.params.id)
            .populate('questions')
            .populate('leaderboard.studentId', 'username email image');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Update Quiz (Admin/Creator)
router.put('/:id', 
    passport.authenticate('jwt', { session: false }), 
    checkUserStatus,
    async (req, res) => {
        try {
            const quiz = await WeeklyQuiz.findById(req.params.id);
            if (!quiz) {
                return res.status(404).json({ message: 'Quiz not found' });
            }

            // Check authorization
            const isCreator = quiz.createdBy.equals(req.user._id);
            if (req.user.role !== 'admin' && !isCreator) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const updatedQuiz = await WeeklyQuiz.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            res.status(200).json(updatedQuiz);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
);

// Submit Quiz Results
router.post('/:id/submit', 
    passport.authenticate('jwt', { session: false }), 
    checkUserStatus,
    async (req, res) => {
        try {
            const { score, timeTaken } = req.body;
            const quiz = await WeeklyQuiz.findById(req.params.id);

            if (!quiz) {
                return res.status(404).json({ message: 'Quiz not found' });
            }

            // Check if quiz is active
            const now = new Date();
            if (now < new Date(quiz.startTime) || now > new Date(quiz.endTime)) {
                return res.status(400).json({ message: 'Quiz is not active' });
            }

            // Check if user is in the class
            const classData = await Class.findOne({
                _id: quiz.class,
                students: req.user._id
            });

            if (!classData) {
                return res.status(403).json({ message: 'You are not enrolled in this class' });
            }

            // Check if already submitted
            const existingSubmission = quiz.leaderboard.find(
                entry => entry.studentId.equals(req.user._id)
            );

            if (existingSubmission) {
                return res.status(400).json({ message: 'You have already submitted this quiz' });
            }

            // Add to leaderboard
            quiz.leaderboard.push({
                studentId: req.user._id,
                score,
                timeTaken,
                rank: 0 // Will be calculated later
            });

            // Calculate ranks
            quiz.leaderboard.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.timeTaken - b.timeTaken;
            });

            // Update ranks
            quiz.leaderboard.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            await quiz.save();

            res.status(200).json({
                message: 'Quiz submitted successfully',
                rank: quiz.leaderboard.find(entry => entry.studentId.equals(req.user._id)).rank
            });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
);

// Delete Quiz (Admin/Creator)
router.delete('/:id', 
    passport.authenticate('jwt', { session: false }), 
    checkUserStatus,
    async (req, res) => {
        try {
            const quiz = await WeeklyQuiz.findById(req.params.id);
            if (!quiz) {
                return res.status(404).json({ message: 'Quiz not found' });
            }

            // Check authorization
            const isCreator = quiz.createdBy.equals(req.user._id);
            if (req.user.role !== 'admin' && !isCreator) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            await WeeklyQuiz.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Quiz deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
);

module.exports = router;
