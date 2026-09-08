require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.neon.example'), override: true })

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const OUT_PATH = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(__dirname, '..', '..', 'boxfem_dump.sql')

async function getTables(client) {
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  return res.rows.map((r) => r.table_name).filter((t) => !t.startsWith('playing_with_'))
}

async function getFks(client) {
  const res = await client.query(`
    SELECT tc.table_name AS child, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
  `)
  return res.rows
}

function topoSort(tables, fks) {
  const parents = {}
  for (const f of fks) {
    if (parents[f.child] === undefined) parents[f.child] = new Set()
    parents[f.child].add(f.parent)
  }
  const sorted = []
  const tableSet = new Set(tables)
  const emitted = new Set()
  let guard = 200
  while (sorted.length < tables.length && guard-- > 0) {
    let progress = false
    for (const t of tables) {
      if (emitted.has(t)) continue
      const deps = parents[t] || new Set()
      const ready = [...deps].every((d) => !tableSet.has(d) || emitted.has(d))
      if (ready) {
        emitted.add(t)
        sorted.push(t)
        progress = true
      }
    }
    if (!progress) {
      for (const t of tables) if (!emitted.has(t)) { emitted.add(t); sorted.push(t) }
    }
  }
  return sorted
}

async function getColumns(client, table) {
  const res = await client.query(
    `SELECT column_name, data_type, column_default, is_identity
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  )
  return res.rows
}

function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return String(v)
  if (v instanceof Date) return `'${v.toISOString()}'`
  if (Buffer.isBuffer(v)) return `'\\x${v.toString('hex')}'`
  const s = String(v)
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

async function dumpTable(client, table, cols) {
  const names = cols.map((c) => c.column_name)
  const quoted = names.map((n) => `"${n}"`)
  const res = await client.query(`SELECT * FROM "public"."${table}"`)
  const lines = [`-- Table: ${table} (${res.rows.length} filas)`, `DELETE FROM "public"."${table}";`]
  if (res.rows.length) {
    lines.push(`INSERT INTO "public"."${table}" (${quoted.join(', ')}) VALUES`)
    const vals = res.rows.map((row) => {
      const rowVals = names.map((n) => sqlValue(row[n]))
      return `(${rowVals.join(', ')})`
    })
    lines.push(vals.join(',\n') + ';')
  } else {
    lines.push(`INSERT INTO "public"."${table}" (${quoted.join(', ')}) SELECT ${quoted.join(', ')} WHERE FALSE;`)
  }
  return lines
}

function setvalStatements(tables, colsByTable) {
  const out = []
  for (const t of tables) {
    const serialCols = (colsByTable[t] || []).filter(
      (c) => c.is_identity === 'YES' || (c.column_default && c.column_default.startsWith('nextval'))
    )
    for (const c of serialCols) {
      out.push(
        `SELECT setval(pg_get_serial_sequence('"public"."${t}"', '${c.column_name}'), (SELECT COALESCE(MAX("${c.column_name}"), 1) FROM "public"."${t}"));`
      )
    }
  }
  return out
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : undefined
  })

  console.log(`Conectando a ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME} ...`)
  await client.connect()
  const version = await client.query('SELECT version()')
  console.log('Conectado OK:', version.rows[0].version)

  const tables = await getTables(client)
  const fks = await getFks(client)
  const ordered = topoSort(tables, fks)

  console.log('Tablas detectadas:', ordered.join(', '))

  const colsByTable = {}
  for (const t of ordered) {
    colsByTable[t] = await getColumns(client, t)
  }

  const sql = []
  sql.push('-- ============================================')
  sql.push('-- BoxFem - Dump de datos (generado por backup.js)')
  sql.push(`-- Fecha: ${new Date().toISOString()}`)
  sql.push('-- ============================================')
  sql.push('BEGIN;')
  sql.push('')
  sql.push('-- Limpiar tablas en el destino')
  sql.push(`TRUNCATE TABLE ${ordered.map((t) => `"public"."${t}"`).join(', ')} RESTART IDENTITY CASCADE;`)
  sql.push('')

  let total = 0
  for (const t of ordered) {
    const lines = await dumpTable(client, t, colsByTable[t])
    const count = lines[0].match(/\((\d+) filas\)/)
    if (count) total += Number(count[1])
    sql.push(...lines)
    sql.push('')
  }

  sql.push('-- Restaurar secuencias')
  sql.push(...setvalStatements(ordered, colsByTable))
  sql.push('')
  sql.push('COMMIT;')

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, sql.join('\n'), 'utf8')
  console.log(`\nDump creado: ${OUT_PATH}`)
  console.log(`Total filas exportadas: ${total}`)
  await client.end()
}

main().catch((err) => {
  console.error('Error en backup:', err.message)
  process.exit(1)
})