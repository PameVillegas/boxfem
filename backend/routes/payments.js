const express = require('express')
const router = express.Router()
const { Payment, Client } = require('../models')
const { Op } = require('sequelize')

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: [Client], order: [['paymentDate', 'DESC']] })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const payments = await Payment.findAll({
      where: { paymentDate: { [Op.between]: [startDate, endDate] } },
      include: [Client]
    })

    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    res.json({ payments, total })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create(req.body)
    res.status(201).json(payment)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await Payment.destroy({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
