const mongoose = require('mongoose');

const weeklyQuizSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true
    },
    questions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
    },
    testDescription: {
        type: String,
        required: true
    },
    testDate: {
        type: Date,
        required: true
    },
    testDuration: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    leaderboard: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            score: {
                type: Number,
                required: true
            },
            timeTaken: {
                type: Number,
                required: true
            },
            rank: {
                type: Number,
                required: true
            }
        }
    ],
}, { timestamps: true });

const WeeklyQuiz = mongoose.model('WeeklyQuiz', weeklyQuizSchema);

module.exports = WeeklyQuiz;