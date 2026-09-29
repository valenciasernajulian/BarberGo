const express = require('express')
const bcrypt = require('bcryptjs')
const { query, withDb } = require('./db')
const {
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
} = require('./auth')

const router = express.Router()

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/)
  const nombre = parts.shift() || ''
  const apellido = parts.join(' ')
  return { nombre, apellido }
}

async function loadUser(id) {
  const rows = await query(
    `SELECT u.*, b.id_barberia, b.nombre AS barberia_nombre
     FROM usuarios u
     LEFT JOIN barberias b ON b.id_usuario = u.id_usuario
     WHERE u.id_usuario = ?`,
    [id],
  )
  return rows[0] || null
}

function asUser(row) {
  return publicUser(row, row.id_barberia ? { id_barberia: row.id_barberia, nombre: row.barberia_nombre } : null)
}

const CITA_SELECT = `
  SELECT c.id_cita, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.observaciones, c.fecha_creacion,
         ba.nombre AS barberia, s.nombre AS servicio, s.precio, s.duracion,
         br.nombre AS barbero_nombre, br.apellido AS barbero_apellido,
         u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
  FROM citas c
  JOIN barberias ba ON ba.id_barberia = c.id_barberia
  JOIN servicios s ON s.id_servicio = c.id_servicio
  JOIN barberos br ON br.id_barbero = c.id_barbero
  JOIN usuarios u ON u.id_usuario = c.id_usuario
`

function mapCita(row) {
  return {
    id: row.id_cita,
    barbershop: row.barberia,
    service: row.servicio,
    barber: `${row.barbero_nombre} ${row.barbero_apellido}`.trim(),
    cliente: `${row.cliente_nombre} ${row.cliente_apellido}`.trim(),
    date: String(row.fecha).slice(0, 10),
    time: String(row.hora_inicio).slice(0, 5),
    end: String(row.hora_fin).slice(0, 5),
    price: Number(row.precio),
    duration: row.duracion,
    status: TO_UI[row.estado] || row.estado,
    notes: row.observaciones || '',
  }
}

function horarioTexto(rows) {
  const open = rows.filter((r) => Number(r.estado) !== 0)
  if (!open.length) return 'Horario por confirmar'
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const days = [...new Set(open.map((r) => Number(r.dia_semana)))].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
  const start = open.reduce((min, r) => (String(r.hora_inicio) < min ? String(r.hora_inicio) : min), '23:59:59')
  const end = open.reduce((max, r) => (String(r.hora_fin) > max ? String(r.hora_fin) : max), '00:00:00')
  const label = days.map((d) => names[d]).join(', ')
  return `${label} ${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

router.post('/auth/register', asyncRoute(async (req, res) => {
  const email = cleanEmail(req.body.email)
  const password = String(req.body.password || '')
  const { nombre, apellido } = req.body.nombre && !req.body.apellido && req.body.nombre.includes(' ')
    ? splitName(req.body.nombre)
    : { nombre: String(req.body.nombre || '').trim(), apellido: String(req.body.apellido || '').trim() }
  const rol = req.body.rol === 'administrador' ? 'administrador' : 'cliente'
  if (!nombre) throw httpError(400, 'El nombre es obligatorio')
  if (!apellido) throw httpError(400, 'El apellido es obligatorio')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'El correo no es válido')
  if (password.length < 8) throw httpError(400, 'La contraseña debe tener al menos 8 caracteres')

  const exists = await query('SELECT id_usuario FROM usuarios WHERE email = ?', [email])
  if (exists.length) throw httpError(409, 'Ese correo ya está registrado')

  const hash = await bcrypt.hash(password, 10)
  const result = await query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol) VALUES (?,?,?,?,?,?)`,
    [nombre, apellido, email, hash, String(req.body.telefono || '').trim() || null, rol],
  )
  const row = await loadUser(result.insertId)
  res.status(201).json({ token: signUser(row), user: asUser(row) })
}))

router.post('/auth/login', asyncRoute(async (req, res) => {
  const email = cleanEmail(req.body.email)
  const password = String(req.body.password || '')
  const rows = await query('SELECT * FROM usuarios WHERE email = ?', [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw httpError(401, 'Correo o contraseña incorrectos')
  }
  const full = await loadUser(user.id_usuario)
  res.json({ token: signUser(full), user: asUser(full) })
}))

router.get('/auth/me', auth, asyncRoute(async (req, res) => {
  const row = await loadUser(req.user.id_usuario)
  if (!row) throw httpError(401, 'Debes iniciar sesión')
  res.json(asUser(row))
}))

router.put('/auth/me', auth, asyncRoute(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim()
  const apellido = String(req.body.apellido || '').trim()
  const telefono = String(req.body.telefono || '').trim()
  if (!nombre || !apellido) throw httpError(400, 'Nombre y apellido son obligatorios')
  await query('UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ? WHERE id_usuario = ?', [
    nombre, apellido, telefono || null, req.user.id_usuario,
  ])
  const row = await loadUser(req.user.id_usuario)
  res.json(asUser(row))
}))

router.put('/auth/password', auth, asyncRoute(async (req, res) => {
  const actual = String(req.body.actual || '')
  const nueva = String(req.body.nueva || '')
  if (nueva.length < 8) throw httpError(400, 'La nueva contraseña debe tener al menos 8 caracteres')
  const rows = await query('SELECT password FROM usuarios WHERE id_usuario = ?', [req.user.id_usuario])
  if (!rows[0] || !(await bcrypt.compare(actual, rows[0].password))) {
    throw httpError(400, 'La contraseña actual no coincide')
  }
  const hash = await bcrypt.hash(nueva, 10)
  await query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hash, req.user.id_usuario])
  res.json({ message: 'Contraseña actualizada' })
}))

router.post('/auth/forgot', asyncRoute(async (req, res) => {
  const email = cleanEmail(req.body.email)
  const rows = await query('SELECT id_usuario FROM usuarios WHERE email = ?', [email])
  if (!rows[0]) {
    return res.json({ message: 'Si el correo está registrado, puedes restablecer la contraseña.' })
  }
  const codigo = String(Math.floor(100000 + Math.random() * 900000))
  const hash = await bcrypt.hash(codigo, 10)
  await query('UPDATE recuperaciones SET usado = 1 WHERE id_usuario = ? AND usado = 0', [rows[0].id_usuario])
  await query(
    `INSERT INTO recuperaciones (id_usuario, codigo_hash, expira) VALUES (?, ?, DATE_ADD(?, INTERVAL 20 MINUTE))`,
    [rows[0].id_usuario, hash, nowBogotaSql()],
  )
  res.json({
    message: 'Código generado. En esta versión no se envía correo.',
    codigo,
  })
}))

router.post('/auth/reset', asyncRoute(async (req, res) => {
  const email = cleanEmail(req.body.email)
  const codigo = String(req.body.codigo || '').trim()
  const password = String(req.body.password || '')
  if (password.length < 8) throw httpError(400, 'La contraseña debe tener al menos 8 caracteres')
  const rows = await query(
    `SELECT r.id_recuperacion, r.codigo_hash, u.id_usuario
     FROM recuperaciones r
     JOIN usuarios u ON u.id_usuario = r.id_usuario
     WHERE u.email = ? AND r.usado = 0 AND r.expira > ?
     ORDER BY r.id_recuperacion DESC LIMIT 1`,
    [email, nowBogotaSql()],
  )
  if (!rows[0] || !(await bcrypt.compare(codigo, rows[0].codigo_hash))) {
    throw httpError(400, 'El código no es válido o ya expiró')
  }
  const hash = await bcrypt.hash(password, 10)
  await query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hash, rows[0].id_usuario])
  await query('UPDATE recuperaciones SET usado = 1 WHERE id_recuperacion = ?', [rows[0].id_recuperacion])
  res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
}))

router.get('/barberias', asyncRoute(async (req, res) => {
  const q = `%${String(req.query.q || '').trim()}%`
  const rows = await query(
    `SELECT b.id_barberia, b.nombre, b.direccion, b.descripcion, b.telefono, b.correo, b.foto,
            ROUND(AVG(c.puntuacion), 1) AS calificacion, COUNT(c.id_calificacion) AS resenas
     FROM barberias b
     LEFT JOIN calificaciones c ON c.id_barberia = b.id_barberia
     WHERE b.estado = 1 AND (b.nombre LIKE ? OR b.direccion LIKE ?)
     GROUP BY b.id_barberia
     ORDER BY b.nombre`,
    [q, q],
  )
  res.json(rows.map((row) => ({
    id: row.id_barberia,
    name: row.nombre,
    address: row.direccion,
    description: row.descripcion || '',
    phone: row.telefono || '',
    email: row.correo || '',
    photo: row.foto || '',
    rating: row.calificacion == null ? null : Number(row.calificacion),
    reviews: Number(row.resenas),
  })))
}))

router.get('/barberias/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const shops = await query(
    `SELECT b.*, ROUND(AVG(c.puntuacion), 1) AS calificacion, COUNT(c.id_calificacion) AS resenas
     FROM barberias b
     LEFT JOIN calificaciones c ON c.id_barberia = b.id_barberia
     WHERE b.id_barberia = ? AND b.estado = 1
     GROUP BY b.id_barberia`,
    [id],
  )
  if (!shops[0]) throw httpError(404, 'Barbería no encontrada')
  const services = await query(
    `SELECT id_servicio, nombre, descripcion, precio, duracion FROM servicios
     WHERE id_barberia = ? AND estado = 1 ORDER BY nombre`,
    [id],
  )
  const barbers = await query(
    `SELECT id_barbero, nombre, apellido, telefono, especialidad, foto
     FROM barberos WHERE id_barberia = ? AND estado = 1 ORDER BY nombre`,
    [id],
  )
  const hours = await query(
    `SELECT h.id_barbero, h.dia_semana, h.hora_inicio, h.hora_fin, h.estado
     FROM horarios h
     JOIN barberos b ON b.id_barbero = h.id_barbero
     WHERE b.id_barberia = ? AND b.estado = 1 AND h.estado = 1`,
    [id],
  )
  const shop = shops[0]
  res.json({
    id: shop.id_barberia,
    name: shop.nombre,
    address: shop.direccion,
    description: shop.descripcion || '',
    phone: shop.telefono || '',
    email: shop.correo || '',
    photo: shop.foto || '',
    rating: shop.calificacion == null ? null : Number(shop.calificacion),
    reviews: Number(shop.resenas),
    schedule: horarioTexto(hours),
    services: services.map((s) => ({
      id: s.id_servicio,
      name: s.nombre,
      description: s.descripcion || '',
      price: Number(s.precio),
      duration: s.duracion,
    })),
    barbers: barbers.map((b) => ({
      id: b.id_barbero,
      name: `${b.nombre} ${b.apellido}`.trim(),
      nombre: b.nombre,
      apellido: b.apellido,
      phone: b.telefono || '',
      specialty: b.especialidad || '',
      photo: b.foto || '',
      days: hours.filter((h) => h.id_barbero === b.id_barbero).map((h) => ({
        day: Number(h.dia_semana),
        start: String(h.hora_inicio).slice(0, 5),
        end: String(h.hora_fin).slice(0, 5),
      })),
    })),
  })
}))

router.get('/disponibilidad', asyncRoute(async (req, res) => {
  const idBarbero = Number(req.query.id_barbero)
  const idServicio = Number(req.query.id_servicio)
  const fecha = String(req.query.fecha || '')
  if (!idBarbero || !idServicio || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw httpError(400, 'Faltan barbero, servicio o fecha')
  }
  if (fecha < todayBogota()) throw httpError(400, 'No se pueden consultar fechas pasadas')
  const day = new Date(`${fecha}T12:00:00`).getDay()
  const servicios = await query(
    `SELECT s.duracion, s.id_barberia FROM servicios s
     JOIN barberos b ON b.id_barberia = s.id_barberia
     WHERE s.id_servicio = ? AND s.estado = 1 AND b.id_barbero = ? AND b.estado = 1`,
    [idServicio, idBarbero],
  )
  if (!servicios[0]) throw httpError(404, 'Servicio o barbero no disponible')
  const horarios = await query(
    `SELECT hora_inicio, hora_fin FROM horarios
     WHERE id_barbero = ? AND dia_semana = ? AND estado = 1`,
    [idBarbero, day],
  )
  const citas = await query(
    `SELECT hora_inicio, hora_fin FROM citas
     WHERE id_barbero = ? AND fecha = ? AND estado IN ('pendiente','confirmada')`,
    [idBarbero, fecha],
  )
  const duration = Number(servicios[0].duracion)
  const slots = []
  const isToday = fecha === todayBogota()
  const nowMin = nowMinutesBogota()
  for (const block of horarios) {
    let cursor = toMinutes(block.hora_inicio)
    const end = toMinutes(block.hora_fin)
    while (cursor + duration <= end) {
      const slotEnd = cursor + duration
      const past = isToday && cursor <= nowMin
      const busy = citas.some((c) => cursor < toMinutes(c.hora_fin) && slotEnd > toMinutes(c.hora_inicio))
      slots.push({ hora: fromMinutes(cursor), disponible: !past && !busy })
      cursor += 30
    }
  }
  slots.sort((a, b) => a.hora.localeCompare(b.hora))
  res.json({ fecha, duracion: duration, horarios: slots })
}))

router.post('/citas', auth, asyncRoute(async (req, res) => {
  if (req.user.rol !== 'cliente') throw httpError(403, 'Solo un cliente puede agendar')
  const idBarberia = Number(req.body.id_barberia)
  const idBarbero = Number(req.body.id_barbero)
  const idServicio = Number(req.body.id_servicio)
  const fecha = String(req.body.fecha || '')
  const horaInicio = String(req.body.hora_inicio || '').slice(0, 5)
  if (!idBarberia || !idBarbero || !idServicio || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(horaInicio)) {
    throw httpError(400, 'Completa barbería, servicio, barbero, fecha y hora')
  }
  if (fecha < todayBogota() || (fecha === todayBogota() && toMinutes(horaInicio) <= nowMinutesBogota())) {
    throw httpError(400, 'Ese horario ya pasó')
  }

  const id = await withDb(async (conn) => {
    const lockName = `cita-${idBarbero}-${fecha}`
    const [lockRows] = await conn.query('SELECT GET_LOCK(?, 5) AS locked', [lockName])
    if (Number(lockRows[0].locked) !== 1) throw httpError(409, 'Inténtalo de nuevo en un momento')
    const day = new Date(`${fecha}T12:00:00`).getDay()
    const [servicios] = await conn.query(
        `SELECT s.duracion FROM servicios s
         JOIN barberos b ON b.id_barberia = s.id_barberia AND b.id_barbero = ? AND b.estado = 1
         JOIN horarios h ON h.id_barbero = b.id_barbero AND h.dia_semana = ? AND h.estado = 1
           AND ? >= h.hora_inicio AND ADDTIME(?, SEC_TO_TIME(s.duracion * 60)) <= h.hora_fin
         WHERE s.id_servicio = ? AND s.estado = 1 AND s.id_barberia = ?`,
        [idBarbero, day, `${horaInicio}:00`, `${horaInicio}:00`, idServicio, idBarberia],
      )
      if (!servicios[0]) throw httpError(400, 'Ese horario no está dentro de la atención del barbero')
      const horaFin = addMinutes(horaInicio, servicios[0].duracion)
      const [overlap] = await conn.query(
        `SELECT id_cita FROM citas
         WHERE id_barbero = ? AND fecha = ? AND estado IN ('pendiente','confirmada')
           AND hora_inicio < ? AND hora_fin > ?
         LIMIT 1`,
        [idBarbero, fecha, `${horaFin}:00`, `${horaInicio}:00`],
      )
      if (overlap.length) throw httpError(409, 'Ese horario ya está ocupado')
      const [result] = await conn.query(
        `INSERT INTO citas (id_usuario, id_barberia, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, observaciones)
         VALUES (?,?,?,?,?,?,?,?)`,
        [req.user.id_usuario, idBarberia, idBarbero, idServicio, fecha, `${horaInicio}:00`, `${horaFin}:00`, String(req.body.observaciones || '').trim() || null],
      )
      return result.insertId
  })

  const rows = await query(`${CITA_SELECT} WHERE c.id_cita = ?`, [id])
  res.status(201).json(mapCita(rows[0]))
}))

router.get('/citas/mias', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `${CITA_SELECT} WHERE c.id_usuario = ? ORDER BY c.fecha DESC, c.hora_inicio DESC`,
    [req.user.id_usuario],
  )
  res.json(rows.map(mapCita))
}))

router.get('/citas/:id', auth, asyncRoute(async (req, res) => {
  const rows = await query(`${CITA_SELECT} WHERE c.id_cita = ? AND c.id_usuario = ?`, [req.params.id, req.user.id_usuario])
  if (!rows[0]) throw httpError(404, 'Cita no encontrada')
  res.json(mapCita(rows[0]))
}))

router.patch('/citas/:id/cancelar', auth, asyncRoute(async (req, res) => {
  const result = await query(
    `UPDATE citas SET estado = 'cancelada'
     WHERE id_cita = ? AND id_usuario = ? AND estado IN ('pendiente','confirmada')
       AND TIMESTAMP(fecha, hora_inicio) > ?`,
    [req.params.id, req.user.id_usuario, nowBogotaSql()],
  )
  if (!result.affectedRows) throw httpError(400, 'Esta cita ya no se puede cancelar')
  const rows = await query(`${CITA_SELECT} WHERE c.id_cita = ?`, [req.params.id])
  res.json(mapCita(rows[0]))
}))

async function ownShop(userId) {
  const rows = await query('SELECT * FROM barberias WHERE id_usuario = ? LIMIT 1', [userId])
  return rows[0] || null
}

router.get('/admin/resumen', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) return res.json({ barberia: null, stats: null, hoy: [] })
  const today = todayBogota()
  const statsRows = await query(
    `SELECT
       SUM(fecha = ?) AS citas_hoy,
       SUM(fecha = ? AND estado = 'completada') AS completadas_hoy,
       SUM(estado = 'pendiente') AS pendientes,
       SUM(fecha = ? AND estado = 'completada') AS ingresos_servicios,
       COALESCE(SUM(CASE WHEN fecha = ? AND estado = 'completada' THEN s.precio END), 0) AS ingresos
     FROM citas c
     JOIN servicios s ON s.id_servicio = c.id_servicio
     WHERE c.id_barberia = ?`,
    [today, today, today, today, shop.id_barberia],
  )
  const barbers = await query(
    'SELECT COUNT(*) AS total FROM barberos WHERE id_barberia = ? AND estado = 1',
    [shop.id_barberia],
  )
  const hoy = await query(
    `${CITA_SELECT} WHERE c.id_barberia = ? AND c.fecha = ? ORDER BY c.hora_inicio`,
    [shop.id_barberia, today],
  )
  const stats = statsRows[0]
  res.json({
    barberia: { id: shop.id_barberia, nombre: shop.nombre },
    stats: {
      citasHoy: Number(stats.citas_hoy || 0),
      completadasHoy: Number(stats.completadas_hoy || 0),
      pendientes: Number(stats.pendientes || 0),
      barberos: Number(barbers[0].total),
      ingresos: Number(stats.ingresos || 0),
    },
    hoy: hoy.map(mapCita),
  })
}))

router.get('/admin/barberia', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) return res.json(null)
  const hours = await query(
    `SELECT h.dia_semana, MIN(h.hora_inicio) AS hora_inicio, MAX(h.hora_fin) AS hora_fin
     FROM horarios h
     JOIN barberos b ON b.id_barbero = h.id_barbero
     WHERE b.id_barberia = ? AND h.estado = 1
     GROUP BY h.dia_semana`,
    [shop.id_barberia],
  )
  res.json({
    id: shop.id_barberia,
    name: shop.nombre,
    description: shop.descripcion || '',
    address: shop.direccion,
    phone: shop.telefono || '',
    email: shop.correo || '',
    photo: shop.foto || '',
    hours: hours.map((h) => ({
      day: Number(h.dia_semana),
      start: String(h.hora_inicio).slice(0, 5),
      end: String(h.hora_fin).slice(0, 5),
    })),
  })
}))

router.put('/admin/barberia', auth, adminOnly, asyncRoute(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim()
  const direccion = String(req.body.direccion || '').trim()
  const descripcion = String(req.body.descripcion || '').trim()
  const telefono = String(req.body.telefono || '').trim()
  const correo = String(req.body.correo || '').trim()
  if (!nombre || !direccion) throw httpError(400, 'Nombre y dirección son obligatorios')
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) {
    await query(
      `INSERT INTO barberias (id_usuario, nombre, descripcion, direccion, telefono, correo) VALUES (?,?,?,?,?,?)`,
      [req.user.id_usuario, nombre, descripcion || null, direccion, telefono || null, correo || null],
    )
  } else {
    await query(
      `UPDATE barberias SET nombre = ?, descripcion = ?, direccion = ?, telefono = ?, correo = ? WHERE id_barberia = ?`,
      [nombre, descripcion || null, direccion, telefono || null, correo || null, shop.id_barberia],
    )
  }
  const updated = await ownShop(req.user.id_usuario)
  res.json({ id: updated.id_barberia, name: updated.nombre })
}))

router.put('/admin/horarios', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) throw httpError(400, 'Primero registra la barbería')
  const days = Array.isArray(req.body.dias) ? req.body.dias : []
  const open = days.filter((d) => d && d.abierto && /^\d{2}:\d{2}$/.test(d.inicio) && /^\d{2}:\d{2}$/.test(d.fin))
  for (const day of open) {
    if (day.inicio >= day.fin) throw httpError(400, 'La hora de inicio debe ser menor que la de cierre')
  }
  const barbers = await query('SELECT id_barbero FROM barberos WHERE id_barberia = ? AND estado = 1', [shop.id_barberia])
  if (!barbers.length) throw httpError(400, 'Registra al menos un barbero antes de guardar el horario')
  await query(
    `DELETE h FROM horarios h
     JOIN barberos b ON b.id_barbero = h.id_barbero
     WHERE b.id_barberia = ?`,
    [shop.id_barberia],
  )
  if (open.length) {
    const values = []
    const params = []
    for (const barber of barbers) {
      for (const day of open) {
        values.push('(?,?,?,?,1)')
        params.push(barber.id_barbero, Number(day.dia), `${day.inicio}:00`, `${day.fin}:00`)
      }
    }
    await query(
      `INSERT INTO horarios (id_barbero, dia_semana, hora_inicio, hora_fin, estado) VALUES ${values.join(',')}`,
      params,
    )
  }
  res.json({ message: 'Horarios actualizados' })
}))

router.get('/admin/servicios', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) return res.json([])
  const rows = await query(
    `SELECT id_servicio, nombre, descripcion, precio, duracion FROM servicios
     WHERE id_barberia = ? AND estado = 1 ORDER BY nombre`,
    [shop.id_barberia],
  )
  res.json(rows.map((s) => ({
    id: s.id_servicio,
    name: s.nombre,
    description: s.descripcion || '',
    price: Number(s.precio),
    duration: s.duracion,
  })))
}))

router.post('/admin/servicios', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) throw httpError(400, 'Primero registra la barbería')
  const nombre = String(req.body.nombre || '').trim()
  const precio = Number(req.body.precio)
  const duracion = Number(req.body.duracion)
  if (!nombre || !(precio >= 0) || !(duracion > 0)) throw httpError(400, 'Nombre, precio y duración son obligatorios')
  const result = await query(
    `INSERT INTO servicios (id_barberia, nombre, descripcion, precio, duracion) VALUES (?,?,?,?,?)`,
    [shop.id_barberia, nombre, String(req.body.descripcion || '').trim() || null, precio, duracion],
  )
  res.status(201).json({ id: result.insertId, name: nombre, price: precio, duration: duracion })
}))

router.put('/admin/servicios/:id', auth, adminOnly, asyncRoute(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim()
  const precio = Number(req.body.precio)
  const duracion = Number(req.body.duracion)
  if (!nombre || !(precio >= 0) || !(duracion > 0)) throw httpError(400, 'Nombre, precio y duración son obligatorios')
  const result = await query(
    `UPDATE servicios s
     JOIN barberias b ON b.id_barberia = s.id_barberia
     SET s.nombre = ?, s.precio = ?, s.duracion = ?, s.descripcion = ?
     WHERE s.id_servicio = ? AND b.id_usuario = ? AND s.estado = 1`,
    [nombre, precio, duracion, String(req.body.descripcion || '').trim() || null, req.params.id, req.user.id_usuario],
  )
  if (!result.affectedRows) throw httpError(404, 'Servicio no encontrado')
  res.json({ id: Number(req.params.id), name: nombre, price: precio, duration: duracion })
}))

router.delete('/admin/servicios/:id', auth, adminOnly, asyncRoute(async (req, res) => {
  const result = await query(
    `UPDATE servicios s
     JOIN barberias b ON b.id_barberia = s.id_barberia
     SET s.estado = 0
     WHERE s.id_servicio = ? AND b.id_usuario = ?`,
    [req.params.id, req.user.id_usuario],
  )
  if (!result.affectedRows) throw httpError(404, 'Servicio no encontrado')
  res.json({ message: 'Servicio eliminado' })
}))

router.get('/admin/barberos', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) return res.json([])
  const rows = await query(
    `SELECT id_barbero, nombre, apellido, telefono, especialidad, foto
     FROM barberos WHERE id_barberia = ? AND estado = 1 ORDER BY nombre`,
    [shop.id_barberia],
  )
  res.json(rows.map((b) => ({
    id: b.id_barbero,
    name: `${b.nombre} ${b.apellido}`.trim(),
    nombre: b.nombre,
    apellido: b.apellido,
    phone: b.telefono || '',
    specialty: b.especialidad || '',
    photo: b.foto || '',
  })))
}))

router.post('/admin/barberos', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) throw httpError(400, 'Primero registra la barbería')
  const parsed = req.body.apellido ? { nombre: String(req.body.nombre || '').trim(), apellido: String(req.body.apellido || '').trim() } : splitName(req.body.nombre)
  if (!parsed.nombre || !parsed.apellido) throw httpError(400, 'Escribe nombre y apellido')
  const especialidad = String(req.body.especialidad || '').trim()
  const result = await query(
    `INSERT INTO barberos (id_barberia, nombre, apellido, telefono, especialidad) VALUES (?,?,?,?,?)`,
    [shop.id_barberia, parsed.nombre, parsed.apellido, String(req.body.telefono || '').trim() || null, especialidad || null],
  )
  const sample = await query(
    `SELECT dia_semana, hora_inicio, hora_fin FROM horarios h
     JOIN barberos b ON b.id_barbero = h.id_barbero
     WHERE b.id_barberia = ? AND h.estado = 1 LIMIT 7`,
    [shop.id_barberia],
  )
  const days = sample.length
    ? sample
    : [1, 2, 3, 4, 5, 6].map((dia) => ({ dia_semana: dia, hora_inicio: '08:00:00', hora_fin: '20:00:00' }))
  const values = days.map(() => '(?,?,?,?,1)').join(',')
  const params = []
  for (const day of days) params.push(result.insertId, day.dia_semana, day.hora_inicio, day.hora_fin)
  await query(`INSERT INTO horarios (id_barbero, dia_semana, hora_inicio, hora_fin, estado) VALUES ${values}`, params)
  res.status(201).json({
    id: result.insertId,
    name: `${parsed.nombre} ${parsed.apellido}`,
    nombre: parsed.nombre,
    apellido: parsed.apellido,
    specialty: especialidad,
    photo: '',
  })
}))

router.put('/admin/barberos/:id', auth, adminOnly, asyncRoute(async (req, res) => {
  const parsed = req.body.apellido ? { nombre: String(req.body.nombre || '').trim(), apellido: String(req.body.apellido || '').trim() } : splitName(req.body.nombre)
  if (!parsed.nombre || !parsed.apellido) throw httpError(400, 'Escribe nombre y apellido')
  const especialidad = String(req.body.especialidad || '').trim()
  const result = await query(
    `UPDATE barberos br
     JOIN barberias b ON b.id_barberia = br.id_barberia
     SET br.nombre = ?, br.apellido = ?, br.especialidad = ?, br.telefono = ?
     WHERE br.id_barbero = ? AND b.id_usuario = ? AND br.estado = 1`,
    [parsed.nombre, parsed.apellido, especialidad || null, String(req.body.telefono || '').trim() || null, req.params.id, req.user.id_usuario],
  )
  if (!result.affectedRows) throw httpError(404, 'Barbero no encontrado')
  res.json({ id: Number(req.params.id), name: `${parsed.nombre} ${parsed.apellido}`, specialty: especialidad })
}))

router.delete('/admin/barberos/:id', auth, adminOnly, asyncRoute(async (req, res) => {
  const result = await query(
    `UPDATE barberos br
     JOIN barberias b ON b.id_barberia = br.id_barberia
     SET br.estado = 0
     WHERE br.id_barbero = ? AND b.id_usuario = ?`,
    [req.params.id, req.user.id_usuario],
  )
  if (!result.affectedRows) throw httpError(404, 'Barbero no encontrado')
  res.json({ message: 'Barbero eliminado' })
}))

router.get('/admin/citas', auth, adminOnly, asyncRoute(async (req, res) => {
  const shop = await ownShop(req.user.id_usuario)
  if (!shop) return res.json([])
  const estado = TO_DB[req.query.estado]
  const params = [shop.id_barberia]
  let sql = `${CITA_SELECT} WHERE c.id_barberia = ?`
  if (estado) {
    sql += ' AND c.estado = ?'
    params.push(estado)
  }
  sql += ' ORDER BY c.fecha DESC, c.hora_inicio DESC'
  const rows = await query(sql, params)
  res.json(rows.map(mapCita))
}))

router.patch('/admin/citas/:id', auth, adminOnly, asyncRoute(async (req, res) => {
  const estado = TO_DB[req.body.estado]
  if (!estado) throw httpError(400, 'Estado no válido')
  const result = await query(
    `UPDATE citas c
     JOIN barberias b ON b.id_barberia = c.id_barberia
     SET c.estado = ?
     WHERE c.id_cita = ? AND b.id_usuario = ?`,
    [estado, req.params.id, req.user.id_usuario],
  )
  if (!result.affectedRows) throw httpError(404, 'Cita no encontrada')
  const rows = await query(`${CITA_SELECT} WHERE c.id_cita = ?`, [req.params.id])
  res.json(mapCita(rows[0]))
}))

module.exports = router
