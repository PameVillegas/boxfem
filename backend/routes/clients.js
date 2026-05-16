const express = require('express')
const router = express.Router()
const { Client, Payment, Plan, Attendance } = require('../models')
const { Op } = require('sequelize')
const dayjs = require('dayjs')

router.get('/', async (req, res) => {
  try {
    const clients = await Client.findAll({ include: [Plan], order: [['lastName', 'ASC']] })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/expired', async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const clients = await Client.findAll({
      where: { expirationDate: { [Op.lt]: today }, status: 'active' }
    })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, { include: [Plan] })
    const payments = await Payment.findAll({ where: { clientId: req.params.id }, order: [['paymentDate', 'DESC']] })
    const attendance = await Attendance.findAll({ where: { clientId: req.params.id }, order: [['checkInTime', 'DESC']] })
    res.json({ client, payments, attendance })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const client = await Client.create(req.body)
    res.status(201).json(client)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    await Client.update(req.body, { where: { id: req.params.id } })
    const client = await Client.findByPk(req.params.id)
    res.json(client)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await Client.destroy({ where: { id: req.params.id } })
    res.json({ message: 'Cliente eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, paymentMethod, planMonth } = req.body
    const client = await Client.findByPk(req.params.id)
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

    const payment = await Payment.create({
      clientId: client.id,
      amount,
      paymentMethod,
      planMonth,
      receiptNumber: `REC-${Date.now()}`
    })

    const newExpiration = dayjs(client.expirationDate).add(30, 'day').format('YYYY-MM-DD')
    await Client.update({ expirationDate: newExpiration, status: 'active' }, { where: { id: client.id } })

    const updatedClient = await Client.findByPk(client.id)
    res.json({ payment, client: updatedClient })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
