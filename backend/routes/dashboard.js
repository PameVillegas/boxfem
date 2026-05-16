const express = require('express')
const router = express.Router()
const { Client, Payment, Attendance, Class } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const dayjs = require('dayjs')

router.get('/stats', async (req, res) => {
  try {
    const totalClients = await Client.count()
    const activeClients = await Client.count({ where: { status: 'active' } })
    const expiredClients = await Client.count({ where: { status: 'expired' } })

    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD')

    const monthlyPayments = await Payment.findAll({
      where: { paymentDate: { [Op.between]: [monthStart, monthEnd] } },
      attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']]
    })

    const todayAttendance = await Attendance.count({
      where: { date: dayjs().format('YYYY-MM-DD') }
    })

    const classes = await Class.findAll({
      attributes: ['id', 'name', [fn('COUNT', col('Clients.id')), 'enrolledCount']],
      include: [{ model: Client, attributes: [], through: { attributes: [] } }],
      group: ['Class.id'],
      order: [[literal('"enrolledCount"'), 'DESC']],
      limit: 5
    })

    res.json({
      totalClients,
      activeClients,
      expiredClients,
      monthlyIncome: parseFloat(monthlyPayments[0]?.getDataValue('total') || 0),
      todayAttendance,
      popularClasses: classes.map(c => ({ name: c.name, enrolledCount: parseInt(c.getDataValue('enrolledCount') || 0) }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
