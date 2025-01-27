const crypto = require('crypto')
const {promisify} = require('util')
const bcrypt = require('bcryptjs')
const passport = require('passport')

const {transporter} = require('../config/mail')
const User = require('../models/User')

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
            bcrypt.hash(newUser.password, salt, async (err, hash) => {
                try {
                    if (err) throw(err)
                    newUser.password = hash
                    /* Make sure to save user inside this callback */
                    // save user (commit change)
                    await newUser.save()
                    req.flash('success_msg', "You're now registered. You can log in.")
                    res.redirect('/account/login')
                } catch (error) {
                    res.render('account/register', {
                        ...req.body, 
                        ...error, 
                        failure_msg: "Unable to create account. Try again, following the instrucitons."
                    })
                }
            })
        })
    } catch (error) {
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

// @desc    show change passowrd
module.exports.showChangePassword = (req, res) => {
    res.render('account/password/change')
}

// @desc    show change passowrd
module.exports.changePassword = async (req, res) => {
    try {
        let error = {errors:{}}, errorFound = false
        for(let field in req.body){
            if (req.body[field] === '') {
                errorFound = true
                error.errors[field] = 'field cannot be empty'
            }
        }
        if (!errorFound) {
            const {old_password, password, password2} = req.body
            let user = await User.findById(req.user.id)
            // check password
            bcrypt.compare(old_password, user.password)
            .then(isMatch => {
                if(isMatch) {
                    if(password === password2) {
                        user.password = req.body.password
                        error = user.validateSync()
                        if (error) throw (error)
                        // hash password
                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(password, salt, (err, hash) => {
                                if (err) throw(err)
                                user.password = hash
                                /* Make sure to save user inside this callback */
                                // save user (commit change)
                                user.save()
                                req.flash('success_msg', "password changed")
                                res.redirect('/account')
                            })
                        })
                    }
                    else {
                        error.errors['password2'] = 'passwords do not match'
                        throw ""
                    }
                }
                else {
                    error.errors['old_password'] = 'please enter your old password correctly'
                    throw ""
                }
            })
            .catch(err => {
                res.render('account/password/change', {
                    ...error
                })
            })       
        }
        else {
            throw(error)
        }
    } catch(error) {
        res.render('account/password/change', {
            ...error
        })
    }
}

// @desc    show forgot password
module.exports.showForgotPassword = (req, res) => {
    res.render('account/password/forgot')
}

// @desc    process forgot password
module.exports.sendResetEmail = async (req, res) => {
    let error = {errors: {}}
    try {
        if (req.body.email.trim() === '') {
            error.errors['email'] = "field cannot be empty"
            throw ''
        }
        const user = await User.findOne({email: req.body.email})
        if(!user) {
            error.errors['email'] = "there is no user with this email"
            throw ''
        }
        // create token
        const token = (await promisify(crypto.randomBytes)(20)).toString('hex')
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000    // expires in an hour
        await user.save()

        const resetEmail = {
            to: req.body.email,
            from: process.env.EMAIL_USER,
            subject: `Password reset on ${req.headers.host}`,
            text: `
                You are receiving this because you have requested a password reset for your account.
                Please click on the following link, or paste this into your browser to complete the process:
                http://${req.headers.host}/account/password/reset/${token}
                
                If you did not request this, please ignore this email and your password will remain unchanged.
            `,
        }
        await transporter.sendMail(resetEmail)
        res.render('account/password/email_sent')
    } catch (err) {
        res.render('account/password/forgot', {
            email: req.body.email,
            ...error
        })
    }
}

// @desc    show reset page
module.exports.showResetPassword = async (req, res) => {
    try {
        const user = await User.find({
            resetPasswordToken: req.params.token, 
            resetPasswordExpires: {$gt : Date.now()}
        })
        if(user.length < 1) throw ''

        res.render('account/password/reset', {
            token: req.params.token
        })
    } catch (error) {
        req.flash('error', 'Password reset token is invalid or has expired.')
        res.redirect('/account/password/forgot')
    }
}

// @desc    process reset
module.exports.resetPassword = async (req, res) => {
    try {
        let error = {errors: {}}
        let user = await User.findOne({
            resetPasswordToken: req.params.token, 
            resetPasswordExpires: {$gt : Date.now()}
        })
        console.log(user)
        if(!user) throw ''
        
        const {password, password2} = req.body
        for(let field in req.body) {
            if (req.body[field] === '') {
                error.errors[field] = 'field cannot be empty'
            }
        }
        if(password !== password2) {
            error.errors.password2 = 'passwords do not match'
        }

        if(Object.keys(error.errors).length > 0) throw (error)

        user.password = password
        // remove reset properties
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined

        error = user.validateSync()
        if (error) throw (error)

        // hash password
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)
        user.password = hash
        user.save()

        req.flash('success_msg', 'Password reset complete. You may login now.')
        res.redirect('/account/login')
    } catch (error) {
        res.render('account/password/reset', {
            token: req.params.token,
            ...error
        })
    }
}
