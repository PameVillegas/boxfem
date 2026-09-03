const express = require('express')
const router = express.Router()
const { Client, Payment, Attendance, Class } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
const argToday = () => dayjs().tz('America/Argentina/Buenos_Aires')

router.get('/stats', async (req, res) => {
  try {
    const totalClients = await Client.count()
    const activeClients = await Client.count({ where: { status: 'active' } })
    const expiredClients = await Client.count({ where: { status: 'expired' } })

    const now = argToday()
    const monthStart = now.startOf('month').format('YYYY-MM-DD')
    const monthEnd = now.endOf('month').format('YYYY-MM-DD')

    // Alumnas activas que no tienen ningun pago registrado en el mes actual
    let pendingPayments = 0
    try {
      const monthPays = await Payment.findAll({
        attributes: ['clientId'],
        where: { paymentDate: { [Op.between]: [monthStart, monthEnd] } }
      })
      const paidIds = new Set(monthPays.map(p => p.clientId))
      const allActive = await Client.findAll({ attributes: ['id'], where: { status: 'active' } })
      pendingPayments = allActive.filter(c => !paidIds.has(c.id)).length
    } catch (e) {
      pendingPayments = 0
    }

    const monthlyPayments = await Payment.findAll({
      where: { paymentDate: { [Op.between]: [monthStart, monthEnd] } },
      attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']]
    })

    const todayAttendance = await Attendance.count({
      where: { date: now.format('YYYY-MM-DD') }
    })

    let popularClasses = []
    try {
      const classes = await Class.findAll({
        attributes: ['id', 'name'],
        include: [{ model: Client, attributes: ['id'], through: { attributes: [] } }]
      })
      popularClasses = classes
        .map(c => ({ name: c.name, enrolledCount: c.Clients ? c.Clients.length : 0 }))
        .sort((a, b) => b.enrolledCount - a.enrolledCount)
        .slice(0, 5)
    } catch (e) {
      // Si falla la query de clases, no romper el dashboard
    }

    // Proxima clase: la clase activa mas proxima (dia de semana + hora), en hora de Argentina
    let nextClass = null
    try {
      const activeClasses = await Class.findAll({ where: { active: true } })
      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const todayWeekday = now.day() // 0 = domingo
      const nowMinutes = now.hour() * 60 + now.minute()
      let best = null
      for (const c of activeClasses) {
        const targetDay = dayOrder.indexOf(c.dayOfWeek)
        if (targetDay === -1) continue
        const [sh, sm] = (c.startTime || '0:0').split(':').map(Number)
        if (isNaN(sh)) continue
        const startMin = sh * 60 + (sm || 0)
        let daysAhead = targetDay - todayWeekday
        // Es hoy pero el turno ya paso -> salta a la proxima semana
        if (daysAhead === 0 && startMin <= nowMinutes) daysAhead = 7
        // Ya paso este dia esta semana
        if (daysAhead < 0) daysAhead += 7
        const score = daysAhead * 1440 + startMin
        if (!best || score < best.score) {
          best = { score, cls: c, dayName: c.dayOfWeek, daysAhead, startMin }
        }
      }
      if (best) {
        const dayLabels = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' }
        nextClass = {
          id: best.cls.id,
          name: best.cls.name,
          startTime: best.cls.startTime,
          endTime: best.cls.endTime,
          dayName: dayLabels[best.dayName] || best.dayName,
          daysAhead: best.daysAhead,
          isToday: best.daysAhead === 0
        }
      }
    } catch (e) {
      nextClass = null
    }

    // Racha de asistencia: la alumna con racha mas larga de dias consecutivos (hasta hoy)
    let topStreak = null
    try {
      const clients = await Client.findAll({
        attributes: ['id', 'name', 'lastName'],
        include: [{ model: Attendance, attributes: ['date'] }]
      })
      let best = { client: null, streak: 0 }
      for (const cl of clients) {
        if (!cl.Attendances || cl.Attendances.length === 0) continue
        const dates = [...new Set(cl.Attendances.map(a => a.date))].sort()
        let streak = 0
        // Empezar de hoy hacia atras (o ayer si hoy aun no asistio)
        let cursor = argToday().subtract(argToday().format('YYYY-MM-DD') === dates[dates.length - 1] ? 0 : 1, 'day')
        const dateSet = new Set(dates)
        while (true) {
          const key = cursor.format('YYYY-MM-DD')
          if (!dateSet.has(key)) break
          streak++
          cursor = cursor.subtract(1, 'day')
        }
        if (streak > best.streak) {
          best = { client: cl, streak }
        }
      }
      if (best.client) {
        topStreak = { name: `${best.client.name} ${best.client.lastName || ''}`.trim(), streak: best.streak }
      }
    } catch (e) {
      topStreak = null
    }

    res.json({
      totalClients,
      activeClients,
      expiredClients,
      monthlyIncome: parseFloat(monthlyPayments[0]?.getDataValue('total') || 0),
      todayAttendance,
      popularClasses,
      pendingPayments,
      nextClass,
      topStreak
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
