require('dotenv').config()
const seq = require('./database')
const { Class, Attendance } = require('../models')

async function run() {
  try {
    await seq.authenticate()
    await Attendance.destroy({ where: {} })
    await seq.query('DELETE FROM "ClassClients"')
    await Class.destroy({ where: {} })

    const clases = [
      { name: 'Funcional - Piernas y Gluteos', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'monday', startTime: '08:00', endTime: '09:00', capacity: 15 },
      { name: 'Funcional - Piernas y Gluteos', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00', capacity: 15 },
      { name: 'Funcional - Piernas y Gluteos', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'monday', startTime: '14:00', endTime: '15:00', capacity: 15 },
      { name: 'Funcional - Piernas y Gluteos', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'monday', startTime: '15:00', endTime: '16:00', capacity: 15 },
      { name: 'Funcional - Piernas y Gluteos', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'monday', startTime: '19:00', endTime: '20:00', capacity: 15 },
      { name: 'Funcional - Piernas y Gluteos', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'monday', startTime: '20:00', endTime: '21:00', capacity: 15 },
      { name: 'Entrenamiento', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'tuesday', startTime: '20:00', endTime: '21:00', capacity: 15 },
      { name: 'Espalda, Brazos y Boxeo', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'wednesday', startTime: '08:00', endTime: '09:00', capacity: 15 },
      { name: 'Espalda, Brazos y Boxeo', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'wednesday', startTime: '09:00', endTime: '10:00', capacity: 15 },
      { name: 'Espalda, Brazos y Boxeo', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'wednesday', startTime: '14:00', endTime: '15:00', capacity: 15 },
      { name: 'Espalda, Brazos y Boxeo', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'wednesday', startTime: '15:00', endTime: '16:00', capacity: 15 },
      { name: 'Espalda, Brazos y Boxeo', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'wednesday', startTime: '19:00', endTime: '20:00', capacity: 15 },
      { name: 'Espalda, Brazos y Boxeo', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'wednesday', startTime: '20:00', endTime: '21:00', capacity: 15 },
      { name: 'Entrenamiento', type: 'boxing', instructor: 'Trinidad', dayOfWeek: 'thursday', startTime: '20:00', endTime: '21:00', capacity: 15 },
      { name: 'Resistencia', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'friday', startTime: '08:00', endTime: '09:00', capacity: 15 },
      { name: 'Resistencia', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'friday', startTime: '09:00', endTime: '10:00', capacity: 15 },
      { name: 'Resistencia', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'friday', startTime: '14:00', endTime: '15:00', capacity: 15 },
      { name: 'Resistencia', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'friday', startTime: '15:00', endTime: '16:00', capacity: 15 },
      { name: 'Resistencia', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'friday', startTime: '19:00', endTime: '20:00', capacity: 15 },
      { name: 'Resistencia', type: 'functional', instructor: 'Trinidad', dayOfWeek: 'friday', startTime: '20:00', endTime: '21:00', capacity: 15 },
    ]

    await Class.bulkCreate(clases)
    console.log(clases.length + ' clases creadas OK')
    process.exit(0)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}

run()
