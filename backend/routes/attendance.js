const express = require('express')
const router = express.Router()
const { Attendance, Client, Class } = require('../models')
const { Op } = require('sequelize')
const dayjs = require('dayjs')

router.get('/', async (req, res) => {
  try {
    const { date } = req.query
    const where = date ? { date } : {}
    const attendance = await Attendance.findAll({
      where,
      include: [Client, Class],
      order: [['checkInTime', 'DESC']]
    })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/checkin', async (req, res) => {
  try {
    const { clientId, classId, method } = req.body
    const client = await Client.findByPk(clientId)
    if (!client || client.status !== 'active') {
      return res.status(400).json({ error: 'Acceso denegado: cuota vencida' })
    }

    const attendance = await Attendance.create({ clientId, classId, method })
    res.json(attendance)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/client/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findAll({
      where: { clientId: req.params.id },
      include: [Class],
      order: [['checkInTime', 'DESC']]
    })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
