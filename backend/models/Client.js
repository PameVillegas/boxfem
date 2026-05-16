const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Client = sequelize.define('Client', {
  name: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  planName: { type: DataTypes.STRING },
  planId: { type: DataTypes.INTEGER },
  expirationDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'expired', 'blocked'), defaultValue: 'active' },
  membershipNumber: { type: DataTypes.STRING, unique: true },
  qrCode: { type: DataTypes.STRING },
  personalCode: { type: DataTypes.STRING },
  joinDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  notes: { type: DataTypes.TEXT },
  emergencyContact: { type: DataTypes.STRING },
  healthNotes: { type: DataTypes.TEXT }
}, { timestamps: true })

module.exports = Client
