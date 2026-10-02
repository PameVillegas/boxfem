const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')
const pino = require('pino')

const logger = pino({ level: 'silent' })

let sock = null
let isReady = false
let qrBase64 = null
let pairingCode = null
let connectionState = 'disconnected'
let retryCount = 0
let connectedAt = 0
let watchdogTimer = null

const MAX_RETRIES = 5
const STABLE_CONNECTION_MS = 60000
const REPLACED_DELAY_MS = 45000
const WATCHDOG_INTERVAL_MS = 300000
const sessionPath = path.join(__dirname, '..', 'wa_session')

// Reiniciar el contador de reintentos y cancelar el watchdog
function resetRetries() {
  retryCount = 0
  if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null }
}

// Si se agotan los reintentos no morir: reintentar cada 5 minutos
// hasta que la sesión vuelva a estar disponible
function scheduleWatchdog() {
  if (watchdogTimer) return
  watchdogTimer = setTimeout(async () => {
    watchdogTimer = null
    retryCount = 0
    if (hasSession()) {
      console.log('[WhatsApp] Watchdog: reintentando conexión')
      await initWhatsApp()
    }
  }, WATCHDOG_INTERVAL_MS)
}

// Verificar si hay sesión guardada
function hasSession() {
  return fs.existsSync(path.join(sessionPath, 'creds.json'))
}

async function initWhatsApp(phoneNumber = null) {
  // Limpiar socket anterior
  if (sock) {
    try {
      sock.ev.removeAllListeners()
      sock.end(undefined)
    } catch (e) {}
    sock = null
  }

  isReady = false
  qrBase64 = null
  pairingCode = null

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const { version } = await fetchLatestBaileysVersion()

    const usePairingCode = !!phoneNumber

    console.log(`[WhatsApp] Iniciando... (version: ${version.join('.')}, modo: ${usePairingCode ? 'pairing' : 'qr/session'})`)

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      browser: usePairingCode ? ['Chrome (Linux)', '', ''] : ['FemmBox', 'Chrome', '120.0.0.0'],
      logger,
      version,
      connectTimeoutMs: 120000,
      keepAliveIntervalMs: 30000,
      markOnlineOnConnect: false
    })

    // Pairing code: solicitar antes de que se genere QR
    if (usePairingCode && !state.creds.registered) {
      connectionState = 'requesting_code'
      await new Promise(resolve => setTimeout(resolve, 3000))

      try {
        // Número sin + ni guiones, con código de país
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
        console.log(`[WhatsApp] requestPairingCode("${cleanNumber}")`)
        const code = await sock.requestPairingCode(cleanNumber)
        pairingCode = code
        connectionState = 'waiting_code'
        console.log(`[WhatsApp] ✅ Código: ${code}`)
      } catch (error) {
        console.error('[WhatsApp] Error pairing code:', error.message)
        connectionState = 'disconnected'
        pairingCode = null
        if (sock) { try { sock.ev.removeAllListeners(); sock.end(undefined) } catch(e){} sock = null }
        return
      }
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      // QR generado (solo si no usamos pairing code)
      if (qr && !usePairingCode) {
        try {
          qrBase64 = await QRCode.toDataURL(qr, { width: 300, margin: 2 })
          connectionState = 'waiting_qr'
          console.log('[WhatsApp] QR listo para escanear')
        } catch (e) {
          console.error('[WhatsApp] Error QR:', e.message)
        }
      }

      // Conectado exitosamente
      if (connection === 'open') {
        isReady = true
        qrBase64 = null
        pairingCode = null
        connectedAt = Date.now()
        connectionState = 'connected'
        // Solo se limpian los reintentos si venía de una sesión sana:
        // reiniciarlos acá hacía que el loop de reconexión nunca termine
        if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null }
        console.log('[WhatsApp] ✅ CONECTADO')
      }

      // Conexión cerrada
      if (connection === 'close') {
        isReady = false
        qrBase64 = null
        pairingCode = null

        const statusCode = lastDisconnect?.error?.output?.statusCode
        const uptime = connectedAt ? Date.now() - connectedAt : 0
        connectedAt = 0
        console.log(`[WhatsApp] Desconectado (código: ${statusCode})`)

        // Logout: limpiar todo
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[WhatsApp] Logout detectado')
          connectionState = 'disconnected'
          await clearSession()
          sock = null
          return
        }

        // Conexión estable antes de caerse: el problema no era la sesión
        if (uptime > STABLE_CONNECTION_MS) retryCount = 0

        // 440 = conexión reemplazada. Pasa al reiniciar el contenedor con
        // otra instancia viva: hay que esperar a que la otra libere la sesión
        const replaced = statusCode === DisconnectReason.connectionReplaced
        if (replaced) {
          console.log('[WhatsApp] Conexión reemplazada, esperando a la otra instancia')
        }

        // Si hay credenciales guardadas, reconectar
        if (hasSession() && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = replaced ? REPLACED_DELAY_MS : Math.min(retryCount * 2000, 10000)
          connectionState = 'reconnecting'
          console.log(`[WhatsApp] Reconectando en ${delay/1000}s (${retryCount}/${MAX_RETRIES})`)
          setTimeout(() => initWhatsApp(), delay)
        } else if (!hasSession()) {
          // No hay sesión, volver a estado inicial
          connectionState = 'disconnected'
          sock = null
          console.log('[WhatsApp] Sin sesión, esperando vinculación')
        } else {
          connectionState = 'disconnected'
          retryCount = 0
          sock = null
          console.log('[WhatsApp] Máximo de reintentos, queda en espera')
          scheduleWatchdog()
        }
      }
    })

    sock.ev.on('creds.update', saveCreds)

  } catch (error) {
    console.error('[WhatsApp] Error fatal:', error.message)
    connectionState = 'disconnected'
    sock = null
  }
}

async function connectWithCode(phoneNumber) {
  resetRetries()
  await clearSession()
  await new Promise(resolve => setTimeout(resolve, 1000))
  await initWhatsApp(phoneNumber)
}

async function restartConnection() {
  resetRetries()
  if (hasSession()) {
    await initWhatsApp()
  } else {
    // Sin sesión: limpiar y volver al inicio
    if (sock) { try { sock.ev.removeAllListeners(); sock.end(undefined) } catch(e){} sock = null }
    isReady = false
    qrBase64 = null
    pairingCode = null
    connectionState = 'disconnected'
  }
}

async function startQR() {
  resetRetries()
  await clearSession()
  await new Promise(resolve => setTimeout(resolve, 1000))
  await initWhatsApp() // Sin número = modo QR
}

async function sendMessage(phone, msg) {
  if (!sock || !isReady) {
    throw new Error('WhatsApp no está conectado')
  }

  const formattedNumber = phone.replace(/[^0-9]/g, '')
  let jid
  if (formattedNumber.startsWith('54')) {
    jid = `${formattedNumber}@s.whatsapp.net`
  } else if (formattedNumber.length === 10) {
    // Argentina: agregar 549 para envío de mensajes
    jid = `549${formattedNumber}@s.whatsapp.net`
  } else {
    jid = `${formattedNumber}@s.whatsapp.net`
  }

  await sock.sendMessage(jid, { text: msg })
  console.log(`[WhatsApp] Enviado a ${formattedNumber}`)
}

function getStatus() {
  if (!sock && connectionState === 'disconnected') {
    return { isReady: false, qrBase64: null, pairingCode: null, connectionState: 'not_linked', retryCount: 0 }
  }
  return { isReady, qrBase64, pairingCode, connectionState, retryCount }
}

async function logout() {
  if (sock) {
    try { await sock.logout() } catch (e) {}
    try { sock.ev.removeAllListeners(); sock.end(undefined) } catch (e) {}
    sock = null
  }
  isReady = false
  qrBase64 = null
  pairingCode = null
  connectionState = 'disconnected'
  resetRetries()
  await clearSession()
}

async function clearSession() {
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
    }
    fs.mkdirSync(sessionPath, { recursive: true })
    console.log('[WhatsApp] Sesión limpiada')
  } catch (e) {
    console.error('[WhatsApp] Error limpiando sesión:', e.message)
  }
}

module.exports = { initWhatsApp, sendMessage, getStatus, connectWithCode, startQR, restartConnection, logout }
