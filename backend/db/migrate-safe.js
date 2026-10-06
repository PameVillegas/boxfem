const sequelize = require('./database')

// Migraciones aditivas e idempotentes: se corren en cada arranque y se pueden
// repetir sin riesgo. Ninguna elimina columnas ni altera datos existentes.
// NO usar sequelize.sync({ force: true }) ni sync({ alter: true }) para esto:
// el primero borra todo y el segundo puede dejar caer columnas no modeladas.
const MIGRATIONS = [
  {
    table: 'Attendances',
    sql: 'ALTER TABLE "Attendances" ADD COLUMN IF NOT EXISTS "modo" VARCHAR(60)'
  }
]

async function migrateSafe() {
  const qi = sequelize.getQueryInterface()
  const applied = []

  for (const { table, sql } of MIGRATIONS) {
    // Si la tabla no existe todavía, sync() la crea ya con los campos del
    // modelo, asi que no hace falta migrar nada (caso de base recien creada)
    const tableExists = await qi.tableExists(table)
    if (!tableExists) {
      applied.push(`[skip] ${table} no existe aun, la crea sync()`)
      continue
    }
    await sequelize.query(sql)
    applied.push(`[ok] ${sql}`)
  }

  return applied
}

module.exports = migrateSafe
