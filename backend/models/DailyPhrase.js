const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const DailyPhrase = sequelize.define('DailyPhrase', {
  phrase: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true })

module.exports = DailyPhrase
