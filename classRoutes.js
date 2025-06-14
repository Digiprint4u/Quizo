const express = require('express');
const router = express.Router();
const Class = require('../modules/others/classSchema'); // আপনার Class মডেলের সঠিক পাথ দিন
const User = require('../modules/user/userSchema'); // User মডেলের পাথ
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');
const crypto = require('crypto'); // <<< পরিবর্তন এখানে: uuid এর পরিবর্তে crypto ব্যবহার করা হয়েছে

// মিডলওয়্যার যা সব রাউটে প্রযোজ্য হবে
router.use(passport.authenticate('jwt', { session: false }), checkUserStatus);

// 1. Create a new class (মেন্টরদের জন্য)
router.post('/create', async (req, res) => {
    try {
        const { classTopic, className, classDescription } = req.body;
        const mentorId = req.user.id;

        // <<< পরিবর্তন এখানে: crypto ব্যবহার করে একটি ৮ অক্ষরের ইউনিক joinCode তৈরি করা হয়েছে
        const joinCode = crypto.randomBytes(4).toString('hex'); 

        const newClass = new Class({
            classTopic,
            className,
            classDescription,
            mentors: [mentorId], // যে মেন্টর ক্লাস তৈরি করছেন, তাকে mentors অ্যারেতে যোগ করা হলো
            joinCode
        });

        const savedClass = await newClass.save();
        res.status(201).json({ message: 'Class created successfully', class: savedClass });

    } catch (error) {
        if (error.code === 11000) { // className বা joinCode ইউনিক না হলে এই এরর আসে
            return res.status(400).json({ message: 'Class name or join code already exists.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 2. Get all classes a user is part of (student or mentor)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const classes = await Class.find({
            $or: [{ students: userId }, { mentors: userId }]
        }).populate('mentors', 'username email').populate('students', 'username email');
        
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. Get a single class details by ID
router.get('/:id', async (req, res) => {
    try {
        const classDetails = await Class.findById(req.params.id)
            .populate('mentors', 'username email image')
            .populate('students', 'username email image');

        if (!classDetails) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.status(200).json(classDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. Join a class using a join code (ছাত্রদের জন্য)
router.post('/join', async (req, res) => {
    try {
        const { joinCode } = req.body;
        const studentId = req.user.id;

        const classToJoin = await Class.findOne({ joinCode });

        if (!classToJoin) {
            return res.status(404).json({ message: 'Invalid join code. Class not found.' });
        }

        // ছাত্রটি বা মেন্টরটি ইতিমধ্যে ক্লাসে আছে কিনা তা পরীক্ষা করা
        if (classToJoin.students.includes(studentId) || classToJoin.mentors.includes(studentId)) {
            return res.status(400).json({ message: 'You are already a member of this class.' });
        }

        classToJoin.students.push(studentId);
        await classToJoin.save();

        res.status(200).json({ message: 'Successfully joined the class!', class: classToJoin });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = router;