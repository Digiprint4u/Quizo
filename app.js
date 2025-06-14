// app.js

const express = require('express');
const app = express();
const dotenv = require('dotenv');
const passport = require('passport');

// ডেটাবেস এবং পাসপোর্ট কনফিগারেশন
const db = require('./config/db');
require('./middleware/passport-config');

// === ধাপ ১: সমস্ত রাউট ফাইল এখানে একবার require করুন ===
// দ্রষ্টব্য: পাথগুলো './routes/...' ফরম্যাটে লেখা হয়েছে। আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী এটি সঠিক হওয়া উচিত।
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const weeklyQuizRoutes = require('./routes/weeklyQuizRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

app.use(express.json());
app.use(passport.initialize());

// === ধাপ ২: রাউটগুলো এখানে ব্যবহার করুন ===
// দ্রষ্টব্য: আমি আপনার দেওয়া পাথগুলোই ব্যবহার করছি (যেমন /user, /class)
console.log("Registering routes...");
app.use('/user', userRoutes);
app.use('/class', classRoutes);
app.use('/weeklyQuiz', weeklyQuizRoutes);
app.use('/notification', notificationRoutes); // <-- আমরা '/notification' ব্যবহার করছি
console.log("Routes registered successfully.");

// একটি বেসিক রুট যা চেক করবে সার্ভার চলছে কিনা
app.get('/', (req, res) => {
    res.send('Server is running and healthy!');
});

const PORT = process.env.PORT || 5000; // একটি ফলব্যাক পোর্ট যোগ করা হলো
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});