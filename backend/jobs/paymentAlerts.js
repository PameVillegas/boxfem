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

  if (dayOfMonth === 15) {
    // Buscar clientas con cuota vencida que no pagaron este mes
    const { Payment } = require('../models')
    const monthStart = today.startOf('month').format('YYYY-MM-DD')
    const allClients = await Client.findAll({ where: { status: 'expired' } })

    for (const client of allClients) {
      // Verificar si tiene algun pago este mes
      const paidThisMonth = await Payment.findOne({
        where: {
          clientId: client.id,
          paymentDate: { [Op.gte]: monthStart }
        }
      })

      if (!paidThisMonth) {
        const msg = `🚨 *FemmBox - Cuota Pendiente + Recargo*\n\nHola ${client.name}, tu cuota aún no fue abonada. A partir del día 10, se aplicó un recargo del 10%.\n\nRegularizá tu situación para seguir entrenando.\n\nAlias: FEMMBOX93\n\nGracias!`
        await Alert.create({
          clientId: client.id,
          type: 'surcharge',
          message: `${client.name} ${client.lastName} - Dia 15: cuota pendiente + recargo 10%`,
          status: 'pending'
        })
        try {
          await whatsapp.sendMessage(client.phone, msg)
          console.log(`Aviso dia 15 enviado a ${client.name} ${client.lastName}`)
        } catch (e) {
          console.log(`No se pudo notificar a ${client.name}: ${e.message}`)
        }
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
