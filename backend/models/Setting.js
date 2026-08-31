const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Setting = sequelize.define('Setting', {
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  value: { type: DataTypes.STRING, allowNull: false }
}, { timestamps: true })

module.exports = Setting
