const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Plan = sequelize.define('Plan', {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationDays: { type: DataTypes.INTEGER, defaultValue: 30 },
  description: { type: DataTypes.TEXT },
  classesPerWeek: { type: DataTypes.INTEGER },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true })

module.exports = Plan
