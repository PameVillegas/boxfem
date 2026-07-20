const express = require('express')
const router = express.Router()
const { getStatus, sendMessage, connectWithCode, startQR, restartConnection, logout } = require('../services/whatsapp')
const { checkPendingPayments, checkDailyExpirations } = require('../jobs/paymentAlerts')

router.get('/status', (req, res) => {
  res.json(getStatus())
})

router.post('/connect-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Se requiere phoneNumber' })
    }
    await connectWithCode(phoneNumber)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/start-qr', async (req, res) => {
  try {
    await startQR()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/test', async (req, res) => {
  try {
    const { phone, message } = req.body
    if (!phone || !message) {
      return res.status(400).json({ error: 'Se requiere phone y message' })
    }
    await sendMessage(phone, message)
    res.json({ success: true, message: 'Mensaje enviado' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/restart', async (req, res) => {
  try {
    await restartConnection()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/logout', async (req, res) => {
  try {
    await logout()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/trigger-check', async (req, res) => {
  try {
    await checkPendingPayments()
    await checkDailyExpirations()
    res.json({ success: true, message: 'Verificación ejecutada' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Pausar/reanudar mensajes automaticos (vacaciones)
let messagesPaused = false
let pauseUntil = null

router.get('/pause-status', (req, res) => {
  res.json({ paused: messagesPaused, pauseUntil })
})

router.post('/pause', (req, res) => {
  const { until } = req.body
  messagesPaused = true
  pauseUntil = until || null
  res.json({ success: true, paused: true, pauseUntil })
})

router.post('/resume', (req, res) => {
  messagesPaused = false
  pauseUntil = null
  res.json({ success: true, paused: false })
})

// Exportar estado de pausa para los jobs
router.isPaused = () => {
  if (!messagesPaused) return false
  if (pauseUntil) {
    const dayjs = require('dayjs')
    if (dayjs().isAfter(dayjs(pauseUntil))) {
      messagesPaused = false
      pauseUntil = null
      return false
    }
  }
  return true
}

module.exports = router
