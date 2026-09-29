const jwt = require('jsonwebtoken')

function signUser(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    return res.status(401).json({ message: 'Debes iniciar sesión' })
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'La sesión expiró. Vuelve a entrar.' })
  }
}

function adminOnly(req, res, next) {
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ message: 'Solo un administrador puede hacer esto' })
  }
  next()
}

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

function todayBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

function nowBogotaSql() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type) => parts.find((p) => p.type === type).value
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

function nowMinutesBogota() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === 'hour').value)
  const minute = Number(parts.find((p) => p.type === 'minute').value)
  return hour * 60 + minute
}

function toMinutes(time) {
  const [h, m] = String(time).slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(total) {
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
}

function addMinutes(time, minutes) {
  return fromMinutes(toMinutes(time) + Number(minutes))
}

const TO_UI = {
  pendiente: 'pending',
  confirmada: 'confirmed',
  cancelada: 'cancelled',
  completada: 'completed',
}

const TO_DB = {
  pending: 'pendiente',
  confirmed: 'confirmada',
  cancelled: 'cancelada',
  completed: 'completada',
}

function publicUser(row, barberia) {
  return {
    id: row.id_usuario,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    telefono: row.telefono || '',
    rol: row.rol,
    fecha_registro: row.fecha_registro,
    barberia: barberia
      ? { id: barberia.id_barberia, nombre: barberia.nombre }
      : null,
  }
}

module.exports = {
  signUser,
  auth,
  adminOnly,
  httpError,
  todayBogota,
  nowBogotaSql,
  nowMinutesBogota,
  toMinutes,
  fromMinutes,
  addMinutes,
  TO_UI,
  TO_DB,
  publicUser,
}
