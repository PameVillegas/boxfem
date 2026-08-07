const express = require('express')
const router = express.Router()
const { Attendance, Client, Class } = require('../models')
const { Op } = require('sequelize')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
const QRCode = require('qrcode')
const jwt = require('jsonwebtoken')

// Fecha/hora SIEMPRE en horario de Argentina (el server puede estar en UTC)
const argNow = () => dayjs().tz('America/Argentina/Buenos_Aires')
const argToday = () => argNow().format('YYYY-MM-DD')

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

    const attendanceDate = date || argToday()
    // Evitar duplicados: mismo client+class+date, o el QR fijo que quedo sin turno (classId null)
    const existing = await Attendance.findOne({
      where: {
        clientId,
        date: attendanceDate,
        [Op.or]: [{ classId }, { classId: null }]
      }
    })
    if (existing) {
      // Si venia del QR fijo sin turno, completamos el horario registrado por la profe
      if (!existing.classId && classId) await existing.update({ classId })
      return res.json({ message: 'Ya registrada', attendance: existing })
    }

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
      { classId: classItem.id, date: argToday(), type: 'attendance_qr' },
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

    const now = argNow()
    const today = now.format('YYYY-MM-DD')
    const currentMinutes = now.hour() * 60 + now.minute()
    const dayName = now.format('dddd').toLowerCase()
    const dayMap = { monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday', thursday: 'thursday', friday: 'friday', lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday' }
    const todayEng = dayMap[dayName] || ''

    // Buscar la clase: el turno ya iniciado mas reciente (14:00-14:59 -> clase 14:00, 15:01 -> clase 15:00)
    const todayClasses = await Class.findAll({ where: { dayOfWeek: todayEng, active: true } })
    const classTimes = todayClasses.map(c => {
      const [sh, sm] = (c.startTime || '0:0').split(':').map(Number)
      return { cls: c, minutes: sh * 60 + sm }
    })
    let bestClass = null
    const started = classTimes.filter(t => t.minutes <= currentMinutes)
    if (started.length > 0) {
      // El turno que arranco mas recientemente
      bestClass = started.reduce((a, b) => (b.minutes > a.minutes ? b : a)).cls
    } else {
      // Todavia no arranco ningun turno: el proximo mas cercano
      let bestDiff = 999
      classTimes.forEach(t => {
        const diff = Math.abs(currentMinutes - t.minutes)
        if (diff < bestDiff) { bestDiff = diff; bestClass = t.cls }
      })
    }

    const classId = bestClass ? bestClass.id : null

    // Evitar duplicados: una sola asistencia por client por dia
    const existing = await Attendance.findOne({ where: { clientId, date: today } })
    if (existing) {
      // Si el QR fijo no habia podido detectar el turno, lo completamos ahora
      if (!existing.classId && classId) await existing.update({ classId })
      return res.json({ message: 'Ya registrada hoy', attendance: existing })
    }

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

// Eliminar asistencia
router.delete('/:id', async (req, res) => {
  try {
    await Attendance.destroy({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
