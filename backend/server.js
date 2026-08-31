require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cron = require('node-cron')
const path = require('path')
const sequelize = require('./db/database')
const { checkPendingPayments, checkDailyExpirations } = require('./jobs/paymentAlerts')
const { initWhatsApp } = require('./services/whatsapp')

require('./models/index')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/clients', require('./routes/clients'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/classes', require('./routes/classes'))
app.use('/api/attendance', require('./routes/attendance'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/alerts', require('./routes/alerts'))
app.use('/api/whatsapp', require('./routes/whatsapp'))
app.use('/api/portal', require('./routes/clientPortal'))
app.use('/api/phrases', require('./routes/phrases'))
app.use('/api/weight-records', require('./routes/weightRecords'))

// En producción, servir el frontend estático
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'))
    }
  })
}

cron.schedule('30 12 * * *', async () => {
  console.log('Revisando vencimientos diarios...')
  await checkDailyExpirations()
})

cron.schedule('0 11 5 * *', async () => {
  console.log('Revisando pagos pendientes (día 5)...')
  await checkPendingPayments()
})

cron.schedule('0 11 10 * *', async () => {
  console.log('Aplicando recargos (día 10)...')
  await checkPendingPayments()
})

cron.schedule('0 11 15 * *', async () => {
  console.log('Verificando pagos pendientes (día 15)...')
  await checkPendingPayments()
})

// Recordatorio 30 min antes de cada clase (horarios en UTC, Argentina es UTC-3)
const { sendPreClassReminders } = require('./jobs/preClassReminder')
cron.schedule('30 10,11,16,17,21,22 * * 1-5', async () => {
  console.log('Verificando recordatorios pre-clase...')
  await sendPreClassReminders()
})

async function start() {
  try {
    await sequelize.authenticate()
    console.log('PostgreSQL conectado')
    await sequelize.sync()
    console.log('Tablas sincronizadas')
    app.listen(process.env.PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en puerto ${process.env.PORT}`)
    })

    // Solo iniciar WhatsApp si ya hay sesión guardada
    const fs = require('fs')
    const path = require('path')
    const sessionPath = path.join(__dirname, 'wa_session')
    const hasSession = fs.existsSync(path.join(sessionPath, 'creds.json'))
    if (hasSession) {
      console.log('Sesión de WhatsApp encontrada, reconectando...')
      setTimeout(() => initWhatsApp(), 2000)
    } else {
      console.log('Sin sesión de WhatsApp. Vinculá desde la app.')
    }
  } catch (error) {
    console.error('Error al iniciar:', error)
  }
}

start()
