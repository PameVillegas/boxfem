require('dotenv').config()
const sequelize = require('./database')
const { Client } = require('../models')
const dayjs = require('dayjs')

async function seedClients() {
  try {
    await sequelize.authenticate()
    console.log('Conectado a la DB')
    await sequelize.sync()

    const clients = [
      { name: 'Lucía', lastName: 'Fernández', phone: '3388451001', email: 'lucia@email.com', planName: 'Premium', status: 'active', expirationDate: dayjs().add(15, 'day').format('YYYY-MM-DD') },
      { name: 'Camila', lastName: 'Rodríguez', phone: '3388451002', email: 'camila@email.com', planName: 'Básico', status: 'active', expirationDate: dayjs().add(5, 'day').format('YYYY-MM-DD') },
      { name: 'Valentina', lastName: 'López', phone: '3388451003', email: 'vale@email.com', planName: 'Ilimitado', status: 'active', expirationDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD') },
      { name: 'Martina', lastName: 'García', phone: '3388451004', email: 'martina@email.com', planName: 'Premium', status: 'expired', expirationDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD') },
      { name: 'Sofía', lastName: 'Martínez', phone: '3388451005', email: 'sofia@email.com', planName: 'Básico', status: 'active', expirationDate: dayjs().add(20, 'day').format('YYYY-MM-DD') },
      { name: 'Julieta', lastName: 'Sánchez', phone: '3388451006', email: 'juli@email.com', planName: 'Ilimitado', status: 'active', expirationDate: dayjs().add(2, 'day').format('YYYY-MM-DD') },
      { name: 'Florencia', lastName: 'Díaz', phone: '3388451007', email: 'flor@email.com', planName: 'Premium', status: 'expired', expirationDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD') },
      { name: 'Agustina', lastName: 'Torres', phone: '3388451008', email: 'agus@email.com', planName: 'Básico', status: 'active', expirationDate: dayjs().add(25, 'day').format('YYYY-MM-DD') },
      { name: 'Milagros', lastName: 'Ramírez', phone: '3388451009', email: 'mili@email.com', planName: 'Premium', status: 'active', expirationDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
      { name: 'Rocío', lastName: 'Herrera', phone: '3388451010', email: 'rocio@email.com', planName: 'Ilimitado', status: 'active', expirationDate: dayjs().add(10, 'day').format('YYYY-MM-DD') }
    ]

    for (const c of clients) {
      await Client.create({
        ...c,
        joinDate: dayjs().subtract(Math.floor(Math.random() * 90) + 30, 'day').format('YYYY-MM-DD')
      })
    }

    console.log('✅ 10 clientes creados!')
    console.log('- 3 con cuota vencida (Valentina, Martina, Florencia, Milagros)')
    console.log('- 7 con cuota activa')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

seedClients()
