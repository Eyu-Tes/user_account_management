const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')

const connectDB = require('./config/db')

// load environment varibles from .env file into process.env
dotenv.config({path: './config/config.env'})

// load DB connection
connectDB()

// initialize app
const app = express()

// use HTTP request logger (development mode only)
process.env.NODE_ENV === 'development' && app.use(morgan('dev'))

const PORT = process.env.PORT || 5000

app.listen(PORT, 
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} ...`))
