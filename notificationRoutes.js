// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();

// !!!!! খুবই গুরুত্বপূর্ণ: এই পাথটি ১০০% সঠিক কিনা তা নিশ্চিত করুন !!!!!
// আপনার Notification Schema ফাইলটি কি আসলেই `modules/others/` ফোল্ডারের ভেতরে আছে?
const Notification = require('../modules/others/notificationSchema');

const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');

// !!!!! ডিবাগিং এর জন্য একটি সহজ টেস্ট রাউট !!!!!
// এই রাউটটি পরীক্ষা করার জন্য কোনো টোকেনের প্রয়োজন নেই।
router.get('/test', (req, res) => {
    res.status(200).send('Notification route file is loaded and test endpoint is working!');
});


// মিডলওয়্যার যা নিচের সব রাউটে প্রযোজ্য হবে
router.use(passport.authenticate('jwt', { session: false }), checkUserStatus);

// 1. Get all notifications for the logged-in user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 2. Mark a single notification as read
router.patch('/:id/mark-read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to perform this action' });
        }
        
        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read', notification });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. Mark all unread notifications as read
router.patch('/mark-all-read', async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        // req.user অবজেক্ট না পেলে এখানে এরর হতে পারে।
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication error: User not found in request.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;