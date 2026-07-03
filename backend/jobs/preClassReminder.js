const dayjs = require('dayjs')
const { Class, Client } = require('../models')
const whatsapp = require('../services/whatsapp')

async function sendPreClassReminders() {
  const now = dayjs().subtract(3, 'hour').add(3, 'hour') // Ajustar: el server esta en UTC, calculamos hora Argentina
  const argNow = dayjs().utcOffset(-3)
  const currentHour = argNow.hour()
  const currentMin = argNow.minute()

  // Calcular que clase empieza en 30 min
  const targetHour = currentMin >= 30 ? currentHour + 1 : currentHour
  const targetTime = `${String(targetHour).padStart(2, '0')}:00`

  // Dia de hoy en ingles
  const dayMap = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }
  const todayEng = dayMap[argNow.day()]

  // Buscar clases que empiezan a la hora target hoy
  const classes = await Class.findAll({
    where: { dayOfWeek: todayEng, startTime: targetTime, active: true },
    include: [Client]
  })

  if (classes.length === 0) return

  const msg = `🥊 *FemmBox - Recordatorio*\n\nEn un rato empieza el entrenamiento.\n\nQuizas hoy estes cansada, con suenio o sin motivacion. Pero la disciplina vale mas que las ganas.\n\nNo faltes por una excusa. Anda por vos! 💪`

  for (const cls of classes) {
    if (!cls.Clients || cls.Clients.length === 0) continue

    for (const client of cls.Clients) {
      if (client.status !== 'active' || !client.phone) continue
      try {
        await whatsapp.sendMessage(client.phone, msg)
        console.log(`Recordatorio enviado a ${client.name} ${client.lastName} para ${cls.startTime}`)
      } catch (e) {
        console.log(`No se pudo enviar a ${client.name}: ${e.message}`)
      }
    }
  }
}

module.exports = { sendPreClassReminders }
