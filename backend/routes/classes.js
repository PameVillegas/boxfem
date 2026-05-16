const express = require('express')
const router = express.Router()
const { Class, Client } = require('../models')

router.get('/', async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: { active: true },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
      include: [Client]
    })
    res.json(classes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const classItem = await Class.findByPk(req.params.id, { include: [Client] })
    res.json(classItem)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const classItem = await Class.create(req.body)
    res.status(201).json(classItem)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    await Class.update(req.body, { where: { id: req.params.id } })
    const classItem = await Class.findByPk(req.params.id, { include: [Client] })
    res.json(classItem)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:id/enroll', async (req, res) => {
  try {
    const { clientId } = req.body
    const classItem = await Class.findByPk(req.params.id)
    const client = await Client.findByPk(clientId)

    if (!client || client.status !== 'active') {
      return res.status(400).json({ error: 'Cliente con cuota vencida' })
    }

    const enrolled = await classItem.countClients()
    if (enrolled >= classItem.capacity) {
      return res.status(400).json({ error: 'Clase llena' })
    }

    await classItem.addClient(client)
    res.json(await Class.findByPk(req.params.id, { include: [Client] }))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:id/unenroll', async (req, res) => {
  try {
    const { clientId } = req.body
    const classItem = await Class.findByPk(req.params.id)
    const client = await Client.findByPk(clientId)
    await classItem.removeClient(client)
    res.json(await Class.findByPk(req.params.id, { include: [Client] }))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
