const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Payment = sequelize.define('Payment', {
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paymentDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  paymentMethod: { type: DataTypes.ENUM('cash', 'transfer', 'card', 'mercadopago'), defaultValue: 'cash' },
  planMonth: { type: DataTypes.STRING },
  receiptNumber: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('paid', 'pending', 'cancelled'), defaultValue: 'paid' },
  notes: { type: DataTypes.TEXT }
}, { timestamps: true })

module.exports = Payment
