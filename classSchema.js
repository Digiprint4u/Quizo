const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    classLogo: {
        type: String,
    },
    classTopic:{
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true,
        unique: true
    },
    classDescription: {
        type: String,
    },
    mentors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    joinCode: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;