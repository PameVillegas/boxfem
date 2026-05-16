const express = require('express')
const router = express.Router()
const { Alert, Client } = require('../models')
const { Op } = require('sequelize')

router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      include: [Client],
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']]
    })
    res.json(alerts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id/resolve', async (req, res) => {
  try {
    await Alert.update({ status: 'resolved' }, { where: { id: req.params.id } })
    res.json({ message: 'Alerta resuelta' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
