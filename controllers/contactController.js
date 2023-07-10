const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const sendEmail = require('../utils/sendEmail')

const contactUs = asyncHandler(async (req, res) => {
    const { message, subject } = req.body
    const user = req.user.id

    // Check if user is in Database
    if(!user) {
        res.status(404)
        throw new Error('User not found. Please sign up.')
    }

    // Validate if subject or message is empty
    if(!message || !subject) {
        res.status(400)
        throw new Error('Please fill subject and message field')
    }

    const send_to = process.env.EMAIL_USER
    const sent_from = user.email
    const reply_to = user.email

    try {
        await sendEmail(subject, message, send_to, sent_from, reply_to)
        res.status(200).json({ success: true, message: 'Mail sent successfully'})
    } catch(error) {
        res.status(500)
        throw new Error('Email not sent, please try again')
    }
})

module.exports = contactUs