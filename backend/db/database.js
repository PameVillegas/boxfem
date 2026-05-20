const { Sequelize } = require('sequelize')

const isProduction = process.env.NODE_ENV === 'production'

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 30000
    } : {}
  }
)

// Mantener la conexión viva (evita cold starts de Neon)
if (isProduction) {
  setInterval(async () => {
    try {
      await sequelize.query('SELECT 1')
    } catch (e) {}
  }, 60000) // ping cada 60 segundos
}

module.exports = sequelize
