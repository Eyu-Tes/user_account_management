const express = require('express')
const {
    showRegisterUser, 
    registerUser, 
    showLoginUser, 
    loginUser, 
    logoutUser, 
    showProfile,
    showUpdateUser, 
    updateUser
} = require('../controllers/account')

const router = express.Router()

// @route   /account/register
router.route('/register')
.get(showRegisterUser)              // @method  GET
.post(registerUser)                 // @method  POST

// @route   /account/login
router.route('/login')
.get(showLoginUser)              // @method  GET
.post(loginUser)                // @method POST

// @route   GET /account/logout
router.get('/logout', logoutUser)

// @route   GET /account
router.get('/', showProfile)

// @route   /account/update
router.route('/update')
.get(showUpdateUser)              // @method  GET
.post(updateUser)                // @method POST

module.exports = router