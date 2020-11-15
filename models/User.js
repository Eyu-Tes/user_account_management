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
        required: [true, 'username cannot be empty'],
        maxlength: [30, 'username cannot exceed 30 characters'],
        trim: true
    }, 
    email: {
        type: String, 
        required: [true, 'email cannot be empty'], 
        unique: true,       // NB: 'unique' option for schemas is not a validator 
        validate: [validateEmail, 'please fill in a valid email address'],
        trim: true  
    }, 
    password: {
        type: String, 
        required: [true, 'password cannot be empty'], 
        minlength: [4, 'password must be atleast 4 characters long'], 
    }, 
    phone: {
        type: String, 
        trim: true, 
    }, 
    sex: {
        type: String, 
        enum: ['male', 'female']
    }, 
    dateJoined: {
        type: Date, 
        default: Date.now
    }
})

// apply the uniqueValidator plugin to UserSchema
UserSchema.plugin(uniqueValidator, {message: 'user with this email already exists'})

// create and export model
module.exports = mongoose.model('User', UserSchema)
