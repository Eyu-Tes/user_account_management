const express = require('express')
const {
    showRegisterUser, 
    registerUser, 
    showLoginUser} = require('../controllers/account')

const router = express.Router()

// @route   /account/register
router.route('/register')
.get(showRegisterUser)              // @method  GET
.post(registerUser)                 // @method  POST

// @route   /account/login
router.route('/login')
.get(showLoginUser)              // @method  GET

module.exports = router
