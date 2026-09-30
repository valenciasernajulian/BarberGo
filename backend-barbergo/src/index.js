require('dotenv').config()
const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const { migrate, seed } = require('./setup')

const app = express()
app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'BarberGo API', health: '/api/health' })
})
app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api', routes)
app.use((err, req, res, next) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Ese dato ya está registrado' })
  }
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ message: status === 500 ? 'Error interno del servidor' : err.message })
})

const port = Number(process.env.PORT || 3000)

migrate()
  .then(() => seed())
  .then(() => {
    app.listen(port, () => {
      console.log(`BarberGo API en http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('No se pudo preparar la base de datos')
    console.error(err)
    process.exit(1)
  })
