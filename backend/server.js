require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const foodRoutes = require('./routes/foods')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'Food Management API',
  })
})

app.use('/api/foods', foodRoutes)

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Thieu bien moi truong MONGODB_URI')
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: '236772_ThiChanhThe',
    })

    console.log('Da ket noi MongoDB Atlas')

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend dang chay tai cong ${PORT}`)
    })
  } catch (error) {
    console.error('Khong the khoi dong Backend:', error.message)
    process.exit(1)
  }
}

startServer()