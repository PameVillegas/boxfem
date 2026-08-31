const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { WeightRecord } = require('../models')

function clientAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No autorizado' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'client') return res.status(403).json({ error: 'Acceso denegado' })
    req.clientId = decoded.id
    next()
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' })
  }
}

router.use(clientAuth)

// Obtener registros de peso del cliente
router.get('/', async (req, res) => {
  try {
    const records = await WeightRecord.findAll({
      where: { clientId: req.clientId },
      order: [['date', 'DESC']]
    })
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear registro de peso
router.post('/', async (req, res) => {
  try {
    const { weight, date } = req.body
    if (!weight || weight <= 0) {
      return res.status(400).json({ error: 'Ingresá un peso válido' })
    }
    const record = await WeightRecord.create({
      clientId: req.clientId,
      weight,
      date: date || new Date()
    })
    res.json(record)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar registro de peso (solo si es del cliente)
router.delete('/:id', async (req, res) => {
  try {
    const record = await WeightRecord.findOne({
      where: { id: req.params.id, clientId: req.clientId }
    })
    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    await record.destroy()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
