const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const asyncHandler = require('express-async-handler')

const protect = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.token

        if(!token) {
            res.status(401)
            throw new Error('Not authorized. Please log in.')
        }

        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET)

        // Get user id from token
        const user = await User.findById(verified.id).select('-password')

        if(!user) {
            res.status(401)
            throw new Error('User not found')
        }
        req.user = user
        next()
    } catch(error) {
        res.status(401)
        throw new Error('Not authorized. Please log in.')
    }
})

module.exports = protect