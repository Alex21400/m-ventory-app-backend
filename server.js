const express = require('express')
const dotenv = require('dotenv').config()
const bodyParser = require('body-parser')
const connectDB = require('./config/connectDB')
const cors = require('cors')
const userRouter = require('./routes/userRoute')
const productRouter = require('./routes/productRoute')
const contactRouter = require('./routes/contactRoute')
const errorHandler = require('./middleware/errorMiddleware')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(cors({
    origin: ['http://localhost:3000', 'https://m-ventory-app.vercel.app'],
    credentials: true
}))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes middleware
app.use('/api/users', userRouter)
app.use('/api/products', productRouter)
app.use('/api/contact', contactRouter)

//Error middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

// Connect DB and start server
const startServer = async () => {
    try {
        await connectDB()

        app.listen(PORT, () => {
            console.log(`Server running on port: ${PORT}`)
        }) 
    } catch (error) {
        console.log(error)
    }
}

startServer()