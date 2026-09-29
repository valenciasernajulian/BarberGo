const mysql = require('mysql2/promise')

const config = {
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: Number(process.env.MYSQL_ADDON_PORT || 3306),
  charset: 'utf8mb4',
  dateStrings: true,
  connectTimeout: 20000,
}

let chain = Promise.resolve()

function withDb(fn) {
  const run = chain.then(async () => {
    const conn = await mysql.createConnection(config)
    try {
      return await fn(conn)
    } finally {
      await conn.end()
    }
  })
  chain = run.then(() => {}, () => {})
  return run
}

async function query(sql, params = []) {
  return withDb(async (conn) => {
    const [rows] = await conn.query(sql, params)
    return rows
  })
}

module.exports = { query, withDb }
