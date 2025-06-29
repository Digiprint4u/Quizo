const express = require('express');
const router = express.Router();
const User = require('../modules/user/userSchema');
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv');
const generateToken = require('../utils/generateToken')
const checkUserStatus = require('../middleware/checkUserStatus')
dotenv.config();
const passport = require('passport');

const fs = require('fs');
const path = require('path');
const { singleImageUpload } = require('../middleware/multer')



router.post('/register', async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;

        if (!username || !email || !password || !phoneNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existUser = await User.findOne({ email });

        if (existUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newSalt = await bcrypt.genSalt(Number(process.env.SALT))
        const hashPassword = await bcrypt.hash(password, newSalt)

        const newUser = new User({ username, email, password: hashPassword, phoneNumber });
        await newUser.save();

        const { auth_token } = await generateToken(newUser)

        res.status(201).json({ message: 'User registered successfully', auth_token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})








router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existUser = await User.findOne({ email });

        if (!existUser) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, existUser.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid' });
        }

        const { auth_token } = await generateToken(existUser)

        res.status(200).json({ message: 'Login successful', auth_token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})





router.get('/profile', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const userId = req.user.id

        const existUser = await User.findById(userId);

        if (!existUser) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        res.status(200).json({ existUser });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})















router.post('/upload-profile-picture', passport.authenticate('jwt', { session: false }), checkUserStatus, singleImageUpload, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.image) {
            const oldImagePath = path.join(__dirname, '..', user.image);

            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.warn('Failed to delete old image:', err.message);
                } else {
                    console.log('Old profile image deleted successfully.');
                }
            });
        }

        user.image = req.file.path;
        await user.save();

        res.status(200).json({
            message: 'Profile picture updated successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});





const { SubscriptionPlan } = require('../modules/user/subscriptionPlanSchema');

// Create a new subscription plan
const createSubscriptionPlan = async (req, res) => {
    try {
        const newSubscriptionPlan = new SubscriptionPlan(req.body);
        const savedSubscriptionPlan = await newSubscriptionPlan.save();
        res.status(201).json(savedSubscriptionPlan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all subscription plans
const getAllSubscriptionPlans = async (req, res) => {
    try {
        const subscriptionPlans = await SubscriptionPlan.find();
        res.status(200).json(subscriptionPlans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a subscription plan by ID
const getSubscriptionPlanById = async (req, res) => {
    try {
        const subscriptionPlan = await SubscriptionPlan.findById(req.params.id);
        if (!subscriptionPlan) {
            return res.status(404).json({ message: 'Subscription plan not found' });
        }
        res.status(200).json(subscriptionPlan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a subscription plan
const updateSubscriptionPlan = async (req, res) => {
    try {
        const updatedSubscriptionPlan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSubscriptionPlan) {
            return res.status(404).json({ message: 'Subscription plan not found' });
        }
        res.status(200).json(updatedSubscriptionPlan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a subscription plan
const deleteSubscriptionPlan = async (req, res) => {
    try {
        const deletedSubscriptionPlan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
        if (!deletedSubscriptionPlan) {
            return res.status(404).json({ message: 'Subscription plan not found' });
        }
        res.status(200).json({ message: 'Subscription plan deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = router;
