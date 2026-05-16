const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Alert = sequelize.define('Alert', {
  clientId: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('payment_reminder', 'surcharge', 'expiration'), defaultValue: 'payment_reminder' },
  message: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('pending', 'sent', 'resolved'), defaultValue: 'pending' },
  readAt: { type: DataTypes.DATE }
}, { timestamps: true })

module.exports = Alert
