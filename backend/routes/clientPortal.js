const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { Client, Payment, Attendance, Class } = require('../models')
const { Op } = require('sequelize')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

// Mismo criterio que routes/attendance.js: el servidor corre en UTC pero el
// dia de la alumna se mide en Argentina
const argToday = () => dayjs().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD')

const MODOS_VALIDOS = ['guerrera', 'tranqui', 'descarga', 'fuerza', 'recuperacion', 'sin_ganas']

// Login de cliente con nombre + apellido + código personal
router.post('/login', async (req, res) => {
  try {
    const { name, lastName, code } = req.body

    if (!name || !lastName || !code) {
      return res.status(400).json({ error: 'Completá nombre, apellido y código' })
    }

    const client = await Client.findOne({
      where: {
        name: { [Op.iLike]: name.trim().replace(/\s+/g, ' ') },
        lastName: { [Op.iLike]: lastName.trim().replace(/\s+/g, ' ') },
        personalCode: code.trim()
      }
    })

    if (!client) {
      return res.status(400).json({ error: 'Datos incorrectos. Consultá tu código en recepción.' })
    }

    const token = jwt.sign(
      { id: client.id, role: 'client', type: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      client: {
        id: client.id,
        name: client.name,
        lastName: client.lastName,
        phone: client.phone,
        status: client.status,
        expirationDate: client.expirationDate,
        planName: client.planName
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Middleware para verificar token de cliente
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

// Perfil del cliente
router.get('/profile', clientAuth, async (req, res) => {
  try {
    const client = await Client.findByPk(req.clientId)
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

    res.json({
      id: client.id,
      name: client.name,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email,
      status: client.status,
      expirationDate: client.expirationDate,
      planName: client.planName,
      joinDate: client.joinDate
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Pagos del cliente
router.get('/payments', clientAuth, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { clientId: req.clientId },
      order: [['paymentDate', 'DESC']]
    })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Asistencias del cliente
router.get('/attendance', clientAuth, async (req, res) => {
  try {
    const attendance = await Attendance.findAll({
      where: { clientId: req.clientId },
      include: [{ model: Class, attributes: ['name', 'type'] }],
      order: [['date', 'DESC']],
      limit: 30
    })
    const monthCount = await Attendance.count({
      where: { clientId: req.clientId, date: { [Op.gte]: dayjs().startOf('month').format('YYYY-MM-DD') } }
    })
    res.json({ attendance, monthCount })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Elegir o cambiar el modo de una asistencia. Solo el mismo dia (Argentina).
// Es opcional: si la alumna no lo elige, la asistencia queda registrada y el
// modo permanece en NULL. Este endpoint nunca crea ni borra asistencias.
router.post('/attendance/:id/mode', clientAuth, async (req, res) => {
  try {
    const { modo } = req.body

    if (!MODOS_VALIDOS.includes(modo)) {
      return res.status(400).json({ error: 'Modo invalido' })
    }

    const attendance = await Attendance.findByPk(req.params.id)
    if (!attendance || Number(attendance.clientId) !== Number(req.clientId)) {
      return res.status(404).json({ error: 'Asistencia no encontrada' })
    }

    const attendanceDay = dayjs(attendance.date).format('YYYY-MM-DD')
    if (attendanceDay !== argToday()) {
      return res.status(400).json({ error: 'El modo solo se puede elegir o cambiar el mismo dia de la asistencia' })
    }

    attendance.modo = modo
    await attendance.save()

    res.json({ success: true, attendance })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Clases disponibles
router.get('/classes', clientAuth, async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: { active: true },
      include: [{ model: Client, attributes: ['id'] }],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    })

    const result = classes.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      instructor: c.instructor,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      capacity: c.capacity,
      enrolled: c.Clients ? c.Clients.length : 0,
      isEnrolled: c.Clients ? c.Clients.some(cl => cl.id === req.clientId) : false
    }))

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Inscribirse a una clase
router.post('/classes/:id/enroll', clientAuth, async (req, res) => {
  try {
    const client = await Client.findByPk(req.clientId)
    if (!client || client.status !== 'active') {
      return res.status(400).json({ error: 'Tu cuota debe estar al día para inscribirte' })
    }

    const classItem = await Class.findByPk(req.params.id, { include: [Client] })
    if (!classItem) return res.status(404).json({ error: 'Clase no encontrada' })

    const enrolled = classItem.Clients ? classItem.Clients.length : 0
    if (enrolled >= classItem.capacity) {
      return res.status(400).json({ error: 'Clase llena' })
    }

    const alreadyEnrolled = classItem.Clients?.some(c => c.id === req.clientId)
    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'Ya estás inscripta en esta clase' })
    }

    await classItem.addClient(client)
    res.json({ success: true, message: 'Inscripción exitosa' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Desinscribirse de una clase
router.post('/classes/:id/unenroll', clientAuth, async (req, res) => {
  try {
    const client = await Client.findByPk(req.clientId)
    const classItem = await Class.findByPk(req.params.id)
    if (!classItem) return res.status(404).json({ error: 'Clase no encontrada' })

    await classItem.removeClient(client)
    res.json({ success: true, message: 'Te desinscribiste de la clase' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
