const User = require('../models/userModel')
const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Token = require('../models/tokenModel')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

// Generate user token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

// Register user
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    // Validation
    if(!name || !email || !password) {
        res.status(400)
        throw new Error('Please fill in all required fields')
    }
    if(password.length < 6) {
        res.status(400)
        throw new Error('Password must be longer than 6 characters')
    }

    // Check if email is already in Database
    const existingUser = await User.findOne({ email })
    if(existingUser) {
        res.status(400)
        throw new Error('User email already in use')
    }

    // Create new user
    const newUser = await User.create({
        name,
        email,
        password
    })

    // Generate token before registering
    const token = generateToken(newUser._id)

    // Send http-only cookie
    res.cookie('token', token, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: 'none', // Means backend and frontend can have different sites
        secure: true 
    })

    if(newUser) {
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            photo: newUser.photo,
            phone: newUser.phone,
            bio: newUser.bio,
            token
        })
    } else {
        res.status(400)
        throw new Error('Invalid user data')
    }
})

// Login User
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    // Validate request
    if(!email || !password) {
        res.status(400)
        throw new Error('Please add email and password')
    }

    const user = await User.findOne({ email })

    if(!user) {
        res.status(400)
        throw new Error('Email not found, please sign up')
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    // Generate token
    const token = generateToken(user._id)

    // Send HTTP-only cookie if password is matching
    if(isPasswordCorrect) {
        res.cookie('token', token, {
            path: '/',
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400),
            sameSite: 'none',
            secure: true
        })
    }

    if(user && isPasswordCorrect) {
        res.json({ 
            _id: user._id,
            name: user.name,
            email: user.email,
            photo: user.photo,
            phone: user.phone,
            bio: user.bio,
            token
        })
    } else {
        res.status(400)
        throw new Error('Invalid email or password')
    }
})

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
    // Make the cookie expire
    res.cookie('token', '' , {
        path: '/',
        httpOnly: true, 
        expires: new Date(0),
        sameSite: 'none',
        secure: true
    })

    return res.status(200).json({ message: 'Successfully logged out'})
})

// Get User data
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if(user) {
        const { _id, name, email, photo, phone, bio } = user
        res.status(200).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio
        })
    } else {
        res.status(404)
        throw new Error('User not found')
    }
})

// Get login status
const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token

    if(!token) {
        return res.json(false)
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET)
    if(verified) {
        return res.json(true)
    }

    return res.json(false)
})

// Update user
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if(user) {
        const { name, email, photo, phone, bio } = user
        user.email = email
        user.name = req.body.name || name
        user.photo = req.body.photo || photo
        user.phone = req.body.phone || phone
        user.bio = req.body.bio || bio

        const updatedUser = await user.save()
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            photo: updatedUser.photo,
            phone: updatedUser.phone,
            bio: updatedUser.bio
        })
    } else {
        res.status(404)
        throw new Error('user not found')
    }
})

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    const { oldPassword, password } = req.body

    if(!user) {
        res.status(404)
        throw new Error('User not found')
    }

    if(!oldPassword || !password) {
        res.status(400)
        throw new Error('Please add old and new password')
    }

    // Check if password is matching to password in DB
    const isPasswordMatching = await bcrypt.compare(oldPassword, user.password)

    if(user && isPasswordMatching) {
        user.password = password
        await user.save()
        res.status(200).send('Password changed successfully')
    } else {
        res.status(400)
        throw new Error('Old password is not correct')
    }
})

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    // Check if user with this email exists
    const user = await User.findOne({ email })

    if(!user) {
        res.status(404)
        throw new Error('User Not Found')
    }

    // Delete token if it exists already in DB
    let token = await Token.findOne({ userId: user._id })
    if(token) {
        await Token.deleteOne()
    }

    // Create reset token
    let resetToken = crypto.randomBytes(32).toString('hex') + user._id

    // Hash token before saving to DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Save token to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
    }).save()
    
    // Constuct reset URL
    const resetURL = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    // Reset email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use URL below to reset your password</p>
        <p>The link is valid only for 30 minutes</p>

        <a href=${resetURL} clicltracking='off'>${resetURL}</a>

        <p>Kind regards, </p>
        <p>M-ventory team</p>
    `
    const subject = 'Password reset request'
    const send_to = user.email
    const send_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, send_from)
        res.status(200).json({ success: true, message: 'Reset email sent'})
    } catch(error) {
        res.status(500)
        throw new Error('Oops, something went wrong... Email not sent. Please try again.')
    }
})

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body
    const resetToken = req.params.resetToken

    // Hash token, then compare to one in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Find token in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()} // is it greater than current time?
    })

    if(!userToken) {
        res.status(400)
        throw new Error('Invalid or expired reset token')
    }
    
    // Find user and save password
    const user = await User.findOne({ _id: userToken.userId })
    user.password = password
    await user.save()

    res.status(200).json({ message: 'Password reset successful' })
})

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword
}