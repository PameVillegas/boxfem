require('dotenv').config()
const sequelize = require('./database')
const { User, Plan } = require('../models')
const bcrypt = require('bcryptjs')

async function migrate() {
  try {
    await sequelize.sync({ force: true })
    console.log('Tablas creadas correctamente.')

    const admin = await User.create({
      username: 'admin',
      email: 'admin@boxfem.com',
      password: 'admin123',
      role: 'admin',
      name: 'Administrador'
    })
    console.log('Usuario admin creado: admin / admin123')

    const planes = await Plan.bulkCreate([
      { name: 'Básico', price: 3000, durationDays: 30, classesPerWeek: 3, description: '3 clases por semana' },
      { name: 'Premium', price: 5000, durationDays: 30, classesPerWeek: 6, description: '6 clases por semana' },
      { name: 'Ilimitado', price: 7000, durationDays: 30, classesPerWeek: 99, description: 'Clases sin límite' }
    ])
    console.log('Planes creados.')

    console.log('Migración completada exitosamente.')
    process.exit(0)
  } catch (error) {
    console.error('Error en migración:', error)
    process.exit(1)
  }
}

migrate()
