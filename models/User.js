const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return re.test(email)
}

// create schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: [true, 'This field is required'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        trim: true
    }, 
    email: {
        type: String, 
        required: [true, 'This field is required'], 
        unique: true,       // NB: 'unique' option for schemas is not a validator 
        validate: [validateEmail, 'Please fill in a valid email address'],
        trim: true  
    }, 
    phoneNumber: {
        type: String, 
        default: '_',
        trim: true, 
    }, 
    sex: {
        type: String, 
        enum: ['male', 'female']
    }, 
    slug: {
        type: String, 
        index: true,
        default: () => `${this.username}-${this.email}`
    },
    dateJoined: {
        type: Date, 
        default: Date.now
    }
})

// apply the uniqueValidator plugin to UserSchema
UserSchema.plugin(uniqueValidator, {message: 'User with this email already exists'})

// create and export model
module.exports = mongoose.Model('User', UserSchema)
