const express = require('express')
const mongoose = require('mongoose')
const Food = require('../models/Food')

const router = express.Router()

// GET /api/foods?search=pho
router.get('/', async (req, res) => {
  try {
    const filter = {}
    const search = req.query.search?.trim()

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')

      filter.$or = [
        { name: regex },
        { foodId: regex },
        { category: regex },
        { cuisine: regex },
      ]
    }

    const foods = await Food.find(filter).sort({ createdAt: -1 })
    res.json(foods)
  } catch (error) {
    res.status(500).json({ message: 'Không thể lấy danh sách món ăn' })
  }
})

// GET /api/foods/:id
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findOne({ foodId: req.params.id })

    if (!food) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' })
    }

    res.json(food)
  } catch (error) {
    res.status(500).json({ message: 'Không thể lấy thông tin món ăn' })
  }
})

// POST /api/foods
router.post('/', async (req, res) => {
  try {
    const {
      foodId, name, category, cuisine, ingredients,
      price, quantity, description, imageUrl,
    } = req.body

    if (
      !foodId?.trim() ||
      !name?.trim() ||
      !category?.trim() ||
      price === undefined ||
      quantity === undefined ||
      price === '' ||
      quantity === ''
    ) {
      return res.status(400).json({
        message: 'Vui lòng nhập mã, tên, danh mục, giá và số lượng',
      })
    }

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message: 'Giá phải không âm; số lượng phải là số nguyên không âm',
      })
    }

    if (await Food.exists({ foodId: foodId.trim() })) {
      return res.status(409).json({ message: 'Mã món ăn đã tồn tại' })
    }

    const food = await Food.create({
      foodId, name, category, cuisine, ingredients,
      price, quantity, description, imageUrl,
    })

    res.status(201).json(food)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Mã món ăn đã tồn tại' })
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message })
    }

    res.status(500).json({ message: 'Không thể thêm món ăn' })
  }
})

// PUT /api/foods/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body }
    delete updates._id
    delete updates.__v
    delete updates.createdAt
    delete updates.updatedAt

    if (updates.foodId !== undefined) {
      if (typeof updates.foodId !== 'string' || !updates.foodId.trim()) {
        return res.status(400).json({ message: 'Mã món ăn không hợp lệ' })
      }

      updates.foodId = updates.foodId.trim()

      if (await Food.exists({
        foodId: updates.foodId,
        _id: { $ne: new mongoose.Types.ObjectId() },
      })) {
        const current = await Food.findOne({ foodId: req.params.id })

        if (!current || current.foodId !== updates.foodId) {
          return res.status(409).json({ message: 'Mã món ăn đã tồn tại' })
        }
      }
    }

    if (updates.price !== undefined &&
        (!Number.isFinite(updates.price) || updates.price < 0)) {
      return res.status(400).json({ message: 'Giá không hợp lệ' })
    }

    if (updates.quantity !== undefined &&
        (!Number.isInteger(updates.quantity) || updates.quantity < 0)) {
      return res.status(400).json({ message: 'Số lượng phải là số nguyên không âm' })
    }

    const food = await Food.findOneAndUpdate(
      { foodId: req.params.id },
      updates,
      { new: true, runValidators: true }
    )

    if (!food) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' })
    }

    res.json(food)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Mã món ăn đã tồn tại' })
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message })
    }

    res.status(500).json({ message: 'Không thể cập nhật món ăn' })
  }
})

// DELETE /api/foods/:id
router.delete('/:id', async (req, res) => {
  try {
    const food = await Food.findOneAndDelete({ foodId: req.params.id })

    if (!food) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' })
    }

    res.json({ message: 'Đã xóa món ăn thành công', food })
  } catch (error) {
    res.status(500).json({ message: 'Không thể xóa món ăn' })
  }
})

module.exports = router