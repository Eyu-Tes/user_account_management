const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const session = require('express-session')
// store session in DB (make sure this goes below the session import)
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const flash = require('connect-flash')
const passport = require('passport')

const connectDB = require('./config/db')

// load environment varibles from .env file into process.env
dotenv.config({path: './config/config.env'})

// load DB connection
connectDB()

// load passport config
require('./config/passport')(passport)

// initialize app
const app = express()

// use HTTP request logger (development mode only)
process.env.NODE_ENV === 'development' && app.use(morgan('dev'))

// handlebars helpers
const {urlsEqual, setChecked} = require('./controllers/helpers/hbs')

// register handlebars as view engine (.hbs extension)
app.engine('.hbs', exphbs({
    helpers: {
        urlsEqual, 
        setChecked
    },
    extname: '.hbs', 
    // Removes error -> Handlebars: Access has been denied to resolve the property
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}))
app.set('view engine', '.hbs')

// body parser (form + json)
app.use(express.urlencoded({extended: false}))
app.use(express.json())

// sessions
app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: false,
    // persists session so that user is still logged in even if server restarts
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

// passport middleware (must be placed below the session middleware)
app.use(passport.initialize())
app.use(passport.session())

// connect flash
app.use(flash())

// global variables
app.use((req, res, next) => {
    res.locals.path = req.url
    res.locals.user = req.user 
    res.locals.success_msg = req.flash('success_msg')
    res.locals.failure_msg = req.flash('failure_msg')
    // flash name provided by passport
    res.locals.error = req.flash('error')
    res.locals.success = req.flash('success')
    next()
})

// load router
app.use('/', require('./routes/index'))
app.use('/account', require('./routes/account'))

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

const PORT = process.env.PORT || 5000

app.listen(PORT, 
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} ...`))
