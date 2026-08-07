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

    res.json({
      totalClients,
      activeClients,
      expiredClients,
      monthlyIncome: parseFloat(monthlyPayments[0]?.getDataValue('total') || 0),
      todayAttendance,
      popularClasses
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
