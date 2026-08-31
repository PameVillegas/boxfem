const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const WeightRecord = sequelize.define('WeightRecord', {
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 1 }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, { timestamps: true })

module.exports = WeightRecord
