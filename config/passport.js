const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

const User = require('../models/User')

module.exports = (passport) => {
    // assign 'email' as the usernameField
    passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
        // match email
        User.findOne({email: email})
            .then(user => {
                const msg = 'Incorrect email or password. Try again.'
                if(!user) return done(null, false, {message: msg})
                // match password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw(err)
                    if (isMatch) return done(null, user)
                    else return done(null, false, {message: msg})
                })
            })
            .catch(err => console.log(err))
    }))

    // serialize & deserialize user
    passport.serializeUser((user, done) => done(null, user.id))
      
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user))
    })
}
