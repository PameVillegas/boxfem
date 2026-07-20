const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const { Class, Client } = require('../models')
const whatsapp = require('../services/whatsapp')

async function sendPreClassReminders() {
  // Verificar si los mensajes estan pausados
  try {
    const whatsappRoutes = require('../routes/whatsapp')
    if (whatsappRoutes.isPaused && whatsappRoutes.isPaused()) {
      console.log('[PreClass] Mensajes pausados (vacaciones)')
      return
    }
  } catch (e) {}

  // Hora actual en Argentina
  const argNow = dayjs().tz('America/Argentina/Buenos_Aires')
  const currentHour = argNow.hour()
  const currentMin = argNow.minute()

  // La clase que empieza en ~30 min: si son las XX:30, la clase es a las (XX+1):00
  const targetHour = currentHour + 1
  const targetTime = `${String(targetHour).padStart(2, '0')}:00`

  // Dia de hoy
  const dayMap = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }
  const todayEng = dayMap[argNow.day()]

  console.log(`[PreClass] Argentina: ${argNow.format('HH:mm')} (${todayEng}) - buscando clase de las ${targetTime}`)

  // Buscar clases que empiezan a la hora target hoy
  const classes = await Class.findAll({
    where: { dayOfWeek: todayEng, startTime: targetTime, active: true },
    include: [Client]
  })

  if (classes.length === 0) {
    console.log(`[PreClass] No hay clases a las ${targetTime} hoy`)
    return
  }

  const msg = `🥊 *FemmBox - Recordatorio*\n\nEn un rato empieza el entrenamiento.\n\nQuizas hoy estes cansada, con suenio o sin motivacion. Pero la disciplina vale mas que las ganas.\n\nNo faltes por una excusa. Anda por vos! 💪`

  for (const cls of classes) {
    if (!cls.Clients || cls.Clients.length === 0) continue

    for (const client of cls.Clients) {
      if (client.status !== 'active' || !client.phone) continue
      try {
        await whatsapp.sendMessage(client.phone, msg)
        console.log(`[PreClass] Enviado a ${client.name} ${client.lastName} (clase ${cls.startTime})`)
      } catch (e) {
        console.log(`[PreClass] Error ${client.name}: ${e.message}`)
      }
    }
  }
}

module.exports = { sendPreClassReminders }
