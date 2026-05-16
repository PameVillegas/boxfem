const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { User } = require('../models')

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ where: { username } })
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' })

    const validPassword = await user.comparePassword(password)
    if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' })

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, name } = req.body
    const user = await User.create({ username, email, password, role, name })
    res.status(201).json({ message: 'Usuario creado' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
