const Client = require('./Client')
const Plan = require('./Plan')
const Payment = require('./Payment')
const Class = require('./Class')
const Attendance = require('./Attendance')
const User = require('./User')
const Alert = require('./Alert')
const DailyPhrase = require('./DailyPhrase')
const WeightRecord = require('./WeightRecord')

Client.belongsTo(Plan, { foreignKey: 'planId' })
Plan.hasMany(Client, { foreignKey: 'planId' })

Client.hasMany(Payment, { foreignKey: 'clientId' })
Payment.belongsTo(Client, { foreignKey: 'clientId' })

Client.hasMany(Attendance, { foreignKey: 'clientId' })
Attendance.belongsTo(Client, { foreignKey: 'clientId' })

Client.hasMany(Alert, { foreignKey: 'clientId' })
Alert.belongsTo(Client, { foreignKey: 'clientId' })

Class.belongsToMany(Client, { through: 'ClassClients', foreignKey: 'classId' })
Client.belongsToMany(Class, { through: 'ClassClients', foreignKey: 'clientId' })

Attendance.belongsTo(Class, { foreignKey: 'classId' })

Client.hasMany(WeightRecord, { foreignKey: 'clientId' })
WeightRecord.belongsTo(Client, { foreignKey: 'clientId' })

module.exports = { Client, Plan, Payment, Class, Attendance, User, Alert, DailyPhrase, WeightRecord }
