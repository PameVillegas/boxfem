const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')

const Class = sequelize.define('Class', {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('boxing', 'functional', 'spinning', 'crossfit', 'yoga', 'pilates', 'personal'), allowNull: false },
  instructor: { type: DataTypes.STRING, allowNull: false },
  dayOfWeek: { type: DataTypes.STRING },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  capacity: { type: DataTypes.INTEGER, defaultValue: 20 },
  room: { type: DataTypes.STRING },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true })

module.exports = Class
