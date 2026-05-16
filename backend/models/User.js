const { DataTypes } = require('sequelize')
const sequelize = require('../db/database')
const bcrypt = require('bcryptjs')

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'trainer', 'reception'), defaultValue: 'reception' },
  name: { type: DataTypes.STRING },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true })

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10)
})

User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

module.exports = User
