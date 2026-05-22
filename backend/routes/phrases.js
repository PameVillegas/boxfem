const express = require('express')
const router = express.Router()
const { DailyPhrase } = require('../models')
const dayjs = require('dayjs')

// Obtener frase de hoy (publico, para el portal)
router.get('/today', async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const phrase = await DailyPhrase.findOne({
      where: { date: today, active: true },
      order: [['createdAt', 'DESC']]
    })
    res.json({ phrase: phrase?.phrase || null })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear/actualizar frase (admin)
router.post('/', async (req, res) => {
  try {
    const { phrase, date } = req.body
    const targetDate = date || dayjs().format('YYYY-MM-DD')
    const existing = await DailyPhrase.findOne({ where: { date: targetDate } })
    if (existing) {
      await existing.update({ phrase })
      res.json(existing)
    } else {
      const newPhrase = await DailyPhrase.create({ phrase, date: targetDate })
      res.json(newPhrase)
    }
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Listar ultimas frases
router.get('/', async (req, res) => {
  try {
    const phrases = await DailyPhrase.findAll({ order: [['date', 'DESC']], limit: 10 })
    res.json(phrases)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
