const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { query } = require('./db')

const PHOTOS = {
  rincon: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop&auto=format',
  moderna: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop&auto=format',
  gentleman: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=400&fit=crop&auto=format',
  carlos: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&auto=format',
  andres: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop&auto=format',
  sebastian: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format',
  felipe: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&auto=format',
  rodrigo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&auto=format',
}

async function migrate() {
  const tables = await query('SHOW TABLES')
  const names = new Set(tables.map((row) => Object.values(row)[0]))
  if (names.has('usuarios') && names.has('citas') && names.has('recuperaciones')) return

  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const statement of statements) {
    await query(statement)
  }
}

async function seed() {
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM usuarios')
  if (Number(total) > 0) return

  const clientPass = await bcrypt.hash('Cliente1234', 10)
  const adminPass = await bcrypt.hash('Admin1234', 10)

  const client = await query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
     VALUES ('Juan', 'García', 'cliente@barberia.co', ?, '3105551000', 'cliente')`,
    [clientPass],
  )
  const admin1 = await query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
     VALUES ('Laura', 'Gómez', 'admin@barberia.co', ?, '3105550000', 'administrador')`,
    [adminPass],
  )
  const admin2 = await query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
     VALUES ('Mateo', 'Ríos', 'moderna@barberia.co', ?, '3105552000', 'administrador')`,
    [adminPass],
  )
  const admin3 = await query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
     VALUES ('Helena', 'Cruz', 'gentleman@barberia.co', ?, '3105553000', 'administrador')`,
    [adminPass],
  )

  const shop1 = await query(
    `INSERT INTO barberias (id_usuario, nombre, descripcion, direccion, telefono, correo, foto)
     VALUES (?, 'El Rincón del Barbero', ?, 'Calle 72 #10-45, Bogotá', '+57 310 555 0000', 'info@elrincon.co', ?)`,
    [admin1.insertId, 'Barbería clásica con más de 15 años de tradición. Especializados en cortes clásicos, degradados y arreglo de barba.', PHOTOS.rincon],
  )
  const shop2 = await query(
    `INSERT INTO barberias (id_usuario, nombre, descripcion, direccion, telefono, correo, foto)
     VALUES (?, 'Barbería Moderna Studio', ?, 'Av. El Dorado #68-42, Bogotá', '+57 310 555 2000', 'info@moderna.co', ?)`,
    [admin2.insertId, 'Espacio contemporáneo con ambiente relajado, enfocado en tendencias actuales y tratamientos capilares.', PHOTOS.moderna],
  )
  const shop3 = await query(
    `INSERT INTO barberias (id_usuario, nombre, descripcion, direccion, telefono, correo, foto)
     VALUES (?, ?, ?, 'Carrera 15 #93-40, Bogotá', '+57 310 555 3000', 'info@gentleman.co', ?)`,
    [admin3.insertId, "The Gentleman's Cut", 'Experiencia premium con ambiente de barbería clásica inglesa. Cada visita incluye bebida de bienvenida.', PHOTOS.gentleman],
  )

  const barbers = [
    [shop1.insertId, 'Carlos', 'Méndez', 'Degradados', PHOTOS.carlos],
    [shop1.insertId, 'Andrés', 'Ruiz', 'Cortes clásicos', PHOTOS.andres],
    [shop2.insertId, 'Sebastián', 'Torres', 'Coloración', PHOTOS.sebastian],
    [shop2.insertId, 'Felipe', 'Castro', 'Cortes modernos', PHOTOS.felipe],
    [shop3.insertId, 'Rodrigo', 'Ospina', 'Afeitado clásico', PHOTOS.rodrigo],
  ]
  const barberIds = []
  for (const row of barbers) {
    const result = await query(
      `INSERT INTO barberos (id_barberia, nombre, apellido, especialidad, foto) VALUES (?,?,?,?,?)`,
      row,
    )
    barberIds.push(result.insertId)
  }

  const services = [
    [shop1.insertId, 'Corte clásico', 25000, 30],
    [shop1.insertId, 'Degradado', 35000, 45],
    [shop1.insertId, 'Arreglo de barba', 20000, 20],
    [shop1.insertId, 'Corte + barba', 50000, 60],
    [shop2.insertId, 'Corte moderno', 40000, 40],
    [shop2.insertId, 'Coloración', 80000, 90],
    [shop2.insertId, 'Tratamiento capilar', 60000, 60],
    [shop2.insertId, 'Afeitado clásico', 30000, 30],
    [shop3.insertId, 'Corte premium', 65000, 45],
    [shop3.insertId, 'Afeitado con navaja', 55000, 40],
    [shop3.insertId, 'Experiencia completa', 120000, 90],
  ]
  const serviceIds = []
  for (const row of services) {
    const result = await query(
      `INSERT INTO servicios (id_barberia, nombre, precio, duracion) VALUES (?,?,?,?)`,
      row,
    )
    serviceIds.push(result.insertId)
  }

  const horarioValues = []
  const horarioParams = []
  for (const id of barberIds) {
    for (let dia = 1; dia <= 6; dia += 1) {
      horarioValues.push('(?,?,?,?,1)')
      horarioParams.push(id, dia, '08:00:00', '20:00:00')
    }
  }
  await query(
    `INSERT INTO horarios (id_barbero, dia_semana, hora_inicio, hora_fin, estado) VALUES ${horarioValues.join(',')}`,
    horarioParams,
  )

  const clientId = client.insertId
  const citas = [
    [clientId, shop1.insertId, barberIds[0], serviceIds[3], '2026-09-29', '18:00:00', '19:00:00', 'confirmada'],
    [clientId, shop1.insertId, barberIds[1], serviceIds[1], '2026-09-29', '11:00:00', '11:45:00', 'completada'],
    [clientId, shop1.insertId, barberIds[0], serviceIds[0], '2026-09-29', '09:00:00', '09:30:00', 'cancelada'],
    [clientId, shop1.insertId, barberIds[0], serviceIds[3], '2026-10-06', '10:00:00', '11:00:00', 'confirmada'],
    [clientId, shop3.insertId, barberIds[4], serviceIds[9], '2026-10-08', '14:30:00', '15:10:00', 'pendiente'],
    [clientId, shop1.insertId, barberIds[1], serviceIds[1], '2026-08-20', '11:00:00', '11:45:00', 'completada'],
    [clientId, shop2.insertId, barberIds[2], serviceIds[5], '2026-08-01', '15:00:00', '16:30:00', 'cancelada'],
    [clientId, shop2.insertId, barberIds[2], serviceIds[4], '2026-07-18', '16:00:00', '16:40:00', 'completada'],
    [clientId, shop3.insertId, barberIds[4], serviceIds[8], '2026-07-02', '12:00:00', '12:45:00', 'completada'],
  ]
  const citaIds = []
  for (const row of citas) {
    const result = await query(
      `INSERT INTO citas (id_usuario, id_barberia, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, estado)
       VALUES (?,?,?,?,?,?,?,?)`,
      row,
    )
    citaIds.push(result.insertId)
  }

  const reviews = [
    [clientId, shop1.insertId, citaIds[1], 5, 'Corte preciso y muy buena atención.'],
    [clientId, shop1.insertId, citaIds[5], 5, 'Volvería sin dudarlo.'],
    [clientId, shop2.insertId, citaIds[7], 4, 'Buen ambiente y corte moderno.'],
    [clientId, shop3.insertId, citaIds[8], 5, 'Una experiencia excelente.'],
  ]
  for (const row of reviews) {
    await query(
      `INSERT INTO calificaciones (id_usuario, id_barberia, id_cita, puntuacion, comentario) VALUES (?,?,?,?,?)`,
      row,
    )
  }
}

module.exports = { migrate, seed }
