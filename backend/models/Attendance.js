const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Attendance = sequelize.define('Attendance', {
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  classId: { type: DataTypes.INTEGER },
  checkInTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  method: { type: DataTypes.ENUM('qr', 'code', 'manual'), defaultValue: 'manual' },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  // 'FemmBox Modo'. NULL = indefinido. Solo se guardan los 6 codigos validos:
  // guerrera, tranqui, descarga, fuerza, recuperacion, sin_ganas
  modo: { type: DataTypes.STRING(60), allowNull: true, defaultValue: null }
}, { timestamps: true })

module.exports = Attendance
