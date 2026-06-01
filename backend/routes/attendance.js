const express = require('express')
const router = express.Router()
const { Attendance, Client, Class } = require('../models')
const { Op } = require('sequelize')
const dayjs = require('dayjs')
const QRCode = require('qrcode')
const jwt = require('jsonwebtoken')

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
    const { clientId, classId, method, date } = req.body
    const client = await Client.findByPk(clientId)
    if (!client || client.status !== 'active') {
      return res.status(400).json({ error: 'Acceso denegado: cuota vencida' })
    }

    const attendanceDate = date || dayjs().format('YYYY-MM-DD')
    // Evitar duplicados
    const existing = await Attendance.findOne({ where: { clientId, classId, date: attendanceDate } })
    if (existing) return res.json({ message: 'Ya registrada', attendance: existing })

    const attendance = await Attendance.create({ clientId, classId, method: method || 'manual', date: attendanceDate })
    res.json(attendance)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Generar QR para un turno (admin)
router.get('/qr/:classId', async (req, res) => {
  try {
    const classItem = await Class.findByPk(req.params.classId)
    if (!classItem) return res.status(404).json({ error: 'Clase no encontrada' })

    // Token temporal que expira en 2 horas
    const token = jwt.sign(
      { classId: classItem.id, date: dayjs().format('YYYY-MM-DD'), type: 'attendance_qr' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    )

    // URL que la alumna escanea
    const host = req.headers.host
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const url = `${protocol}://${host}/portal?qr=${token}`

    const qrImage = await QRCode.toDataURL(url, { width: 300, margin: 2 })
    res.json({ qr: qrImage, url, className: classItem.name, time: `${classItem.startTime}-${classItem.endTime}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Registrar asistencia via QR (alumna escanea)
router.post('/qr-checkin', async (req, res) => {
  try {
    const { token, clientId } = req.body
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.type !== 'attendance_qr') return res.status(400).json({ error: 'QR invalido' })

    const client = await Client.findByPk(clientId)
    if (!client || client.status !== 'active') return res.status(400).json({ error: 'Cuota vencida' })

    const existing = await Attendance.findOne({ where: { clientId, classId: decoded.classId, date: decoded.date } })
    if (existing) return res.json({ message: 'Ya registrada hoy', attendance: existing })

    const attendance = await Attendance.create({ clientId, classId: decoded.classId, method: 'qr', date: decoded.date })
    res.json({ success: true, message: 'Asistencia registrada!', attendance })
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(400).json({ error: 'QR expirado' })
    res.status(400).json({ error: error.message })
  }
})

// QR fijo para imprimir (no expira, registra asistencia del dia actual)
router.get('/qr-fixed', async (req, res) => {
  try {
    const host = req.headers.host
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const url = `${protocol}://${host}/portal?checkin=auto`

    const qrImage = await QRCode.toDataURL(url, { width: 400, margin: 2 })
    res.json({ qr: qrImage, url })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Registrar asistencia via QR fijo (detecta turno automaticamente)
router.post('/qr-auto-checkin', async (req, res) => {
  try {
    const { clientId } = req.body
    const client = await Client.findByPk(clientId)
    if (!client || client.status !== 'active') return res.status(400).json({ error: 'Cuota vencida' })

    const today = dayjs().format('YYYY-MM-DD')
    const hour = dayjs().hour()
    const dayName = dayjs().format('dddd').toLowerCase()
    const dayMap = { monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday', thursday: 'thursday', friday: 'friday', lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }
    const todayEng = dayMap[dayName] || ''

    // Buscar la clase mas cercana a la hora actual
    const todayClasses = await Class.findAll({ where: { dayOfWeek: todayEng, active: true } })
    let bestClass = null
    let bestDiff = 999
    todayClasses.forEach(c => {
      const startHour = parseInt(c.startTime.split(':')[0])
      const diff = Math.abs(hour - startHour)
      if (diff < bestDiff) { bestDiff = diff; bestClass = c }
    })

    const classId = bestClass ? bestClass.id : null

    // Evitar duplicados
    const existing = await Attendance.findOne({ where: { clientId, date: today, ...(classId ? { classId } : {}) } })
    if (existing) return res.json({ message: 'Ya registrada hoy', attendance: existing })

    const attendance = await Attendance.create({ clientId, classId, method: 'qr', date: today })
    res.json({ success: true, message: 'Asistencia registrada!', className: bestClass?.name || 'Clase', attendance })
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
