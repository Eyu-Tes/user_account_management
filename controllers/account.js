const User = require('../models/User')
const bcrypt = require('bcryptjs')
const passport = require('passport')

// @desc    show registration page
module.exports.showRegisterUser = (req, res) => res.render('account/register')

// @desc    process registration
module.exports.registerUser = async (req, res) => {
    let errorFound = false
    try {
        const newUser = await new User({...req.body})
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
                /* Make sure to save user inside this callback */
                // save user (commit change)
                newUser.save()
                req.flash('success_msg', "You're now registered. You can log in.")
                res.redirect('/account/login')
            })
        })
    } catch (error) {
        console.log(error)
        res.render('account/register', {
            ...req.body, 
            ...error, 
            failure_msg: "Unable to create account. Try again, following the instrucitons."
        })
    }
}

// @desc    show login page
module.exports.showLoginUser = (req, res) => res.render('account/login')

// @desc    process login
module.exports.loginUser = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/', 
        successFlash: 'login successful',
        failureRedirect: '/account/login', 
        failureFlash: true,     // message is generated from the passport LocalStrategy config
    })(req, res, next)
}

// @desc    process logout
module.exports.logoutUser = (req, res) => {
    // the passport middleware gives access to the logout function
    req.logout()
    req.flash('success_msg', 'you are logged out')
    res.redirect('/')
}

// @desc    show profile page
module.exports.showProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean()
        res.render('account/profile', {
            ...user
        })
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
}

// @desc    show update page
module.exports.showUpdateUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean()
        res.render('account/edit', {
            ...user
        })
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
}

// @desc    process update
module.exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate({_id: req.user.id}, req.body, {
            // return the modified document rather than the original
            new: true,
            // runs validators 
            runValidators: true,
            // prevents the error: Cannot read property 'ownerDocument' of null
            // lets you set the value of 'this' in update validators to the underlying query.
            context: 'query'
        })
        let error = updatedUser.validateSync()
        if(error) throw(error)
        req.flash('success_msg', 'your profile has been updated')
        res.redirect('/account')
    } catch (error) {
        res.render('account/edit', {
            ...req.body, 
            ...error
        })
    }
}

// @desc    show delete user confirmation
module.exports.showDeleteUser = async (req, res) => {
    try {
        const user = await User.findOne({_id: req.user.id}).lean()
        res.render('account/remove', {
            ...user
        })
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
}

// @desc    process delete
module.exports.deleteUser = async (req, res) => {
    try {
        await User.deleteOne({_id: req.user.id})
        req.flash('success_msg', 'your account has been removed')
        res.redirect('/')
    } catch (error) {
        console.log(error)
    }
}
