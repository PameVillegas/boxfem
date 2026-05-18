require('dotenv').config()
const { Op } = require('sequelize')
const dayjs = require('dayjs')
const { Client, Alert } = require('../models')
const whatsapp = require('../services/whatsapp')

async function checkPendingPayments() {
  const today = dayjs()
  const dayOfMonth = today.date()

  if (dayOfMonth === 5) {
    const expiringSoon = await Client.findAll({
      where: {
        expirationDate: {
          [Op.between]: [today.startOf('month').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
        },
        status: 'active'
      }
    })

    for (const client of expiringSoon) {
      const msg = `🧤 *FemmBox - Recordatorio de Pago*\n\nHola ${client.name}, recordá abonar tu cuota antes del 10 de este mes para evitar recargos.\n\nGracias!`
      await Alert.create({
        clientId: client.id,
        type: 'payment_reminder',
        message: `${client.name} ${client.lastName} debe abonar antes del 10, sino tiene 10% de recargo`,
        status: 'pending'
      })
      try {
        await whatsapp.sendMessage(client.phone, msg)
        console.log(`WhatsApp enviado a ${client.name} ${client.lastName}`)
      } catch (e) {
        console.log(`No se pudo enviar WhatsApp a ${client.name}: ${e.message}`)
      }
    }
  }

  if (dayOfMonth === 10) {
    const unpaid = await Client.findAll({
      where: {
        expirationDate: { [Op.lt]: today.subtract(5, 'day').format('YYYY-MM-DD') },
        status: 'expired'
      }
    })

    for (const client of unpaid) {
      const msg = `⚠️ *FemmBox - Aviso de Recargo*\n\nHola ${client.name}, tu cuota está vencida y se aplicó un recargo del 10%. Pasá a regularizar tu situación.\n\nGracias!`
      await Alert.create({
        clientId: client.id,
        type: 'surcharge',
        message: `${client.name} ${client.lastName} - Recargo del 10% aplicado`,
        status: 'pending'
      })
      try {
        await whatsapp.sendMessage(client.phone, msg)
        console.log(`Recargo notificado a ${client.name}`)
      } catch (e) {
        console.log(`No se pudo notificar a ${client.name}: ${e.message}`)
      }
    }
  }
}

async function checkDailyExpirations() {
  const today = dayjs().format('YYYY-MM-DD')
  const expired = await Client.findAll({
    where: { expirationDate: { [Op.lt]: today }, status: 'active' }
  })

  for (const client of expired) {
    client.status = 'expired'
    await client.save()

    const msg = `⏰ *FemmBox - Cuota Vencida*\n\nHola ${client.name}, tu cuota venció el ${dayjs(client.expirationDate).format('DD/MM/YYYY')}. Acercate a renovar para seguir entrenando.`
    await Alert.create({
      clientId: client.id,
      type: 'expiration',
      message: `${client.name} ${client.lastName} - Cuota vencida`,
      status: 'pending'
    })
    try {
      await whatsapp.sendMessage(client.phone, msg)
    } catch (e) {
      console.log(`No se pudo notificar vencimiento a ${client.name}`)
    }
  }
}

module.exports = { checkPendingPayments, checkDailyExpirations }
