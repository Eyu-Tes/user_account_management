const User = require('../models/User')
const bcrypt = require('bcryptjs')

// @desc    show registration page
module.exports.showRegisterUser = (req, res) => res.render('account/register')

// @desc    process registration
module.exports.registerUser = async (req, res) => {
    let errorFound = false
    try {
        const newUser = new User({...req.body})
        let error = newUser.validateSync() || {errors: {}}
        if (req.body.password2.trim() === ''){
            errorFound = true
            error.errors.password2 = 'confirm password cannot be empty'
        }
        if (req.body.password !== req.body.password2) {
            errorFound = true
            error.errors.password2 = 'passwords do not match'
        }
        // throw error if found
        if (errorFound) throw(error)
        // remove properties that have an empty value but passed the validation
        for(let prop in newUser){
            if (newUser[prop] === '') newUser.set(prop, undefined)
        }
        // hash password
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw(err)
                newUser.password = hash
            })
        })
        // save user (commit change)
        await newUser.save()
        res.redirect('/account/login')
    } catch (error) {
        console.log(error)
        res.render('account/register', {
            ...req.body, 
            error
        })
    }
}

// @desc    show login page
module.exports.showLoginUser = (req, res) => res.render('account/login')
