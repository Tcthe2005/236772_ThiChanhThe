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
      throw new Error('Thiếu biến môi trường MONGODB_URI trong file .env')
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: '236772_ThiChanhThe',
    })

    console.log('Đã kết nối MongoDB Atlas')

    app.listen(PORT, () => {
      console.log(`Backend đang chạy tại http://localhost:$DIL1`)
    })
  } catch (error) {
    console.error('Không thể khởi động Backend:', error.message)
    process.exit(1)
  }
}

startServer()