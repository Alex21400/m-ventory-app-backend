const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'This field is mandatory']
    },
    email: {
        type: String,
        required: [true, 'This field is mandatory'],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email'
        ]
    }, 
    password: {
        type: String,
        required: [true, 'This field is mandatory'],
        minLength: [6, 'Password must be at least 6 characters long'],
        // maxLength: [30, 'Password must be up to 30 characters']
    },
    photo: {
        type: String,
        required: [true, 'This field is mandatory'],
        default: 'https://i.ibb.co/4pDNDk1/avatar.png'
    },
    phone: {
        type: String,
        default: '000'
    },
    bio: {
        type: String,
        maxLength: [250, 'Bio cannot exceed 250 characters'],
        default: 'New user'
    }
}, {
    timestamps: true
})

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')){
        return next()
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = hashedPassword
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User