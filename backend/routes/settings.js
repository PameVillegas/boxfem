const express = require('express')
const router = express.Router()
const { Setting } = require('../models')
const auth = require('../middleware/auth')

// GET publico: lectura de configuracion (panel admin y portal de alumnas)
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findAll()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT admin: actualiza una clave (rechaza tokens de cliente)
router.put('/:key', auth, async (req, res) => {
  try {
    if (req.user && req.user.type === 'client') {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    const { value } = req.body
    let setting = await Setting.findOne({ where: { key: req.params.key } })
    if (setting) {
      setting.value = String(value)
      await setting.save()
    } else {
      setting = await Setting.create({ key: req.params.key, value: String(value) })
    }
    res.json(setting)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
