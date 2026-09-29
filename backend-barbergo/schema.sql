CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol ENUM('cliente','administrador') NOT NULL DEFAULT 'cliente',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS barberias (
  id_barberia INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  direccion VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(150),
  foto VARCHAR(500),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_barberia_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS barberos (
  id_barbero INT AUTO_INCREMENT PRIMARY KEY,
  id_barberia INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  especialidad VARCHAR(100),
  foto VARCHAR(500),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_barbero_barberia FOREIGN KEY (id_barberia) REFERENCES barberias(id_barberia)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS servicios (
  id_servicio INT AUTO_INCREMENT PRIMARY KEY,
  id_barberia INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  duracion INT NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_servicio_barberia FOREIGN KEY (id_barberia) REFERENCES barberias(id_barberia)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS horarios (
  id_horario INT AUTO_INCREMENT PRIMARY KEY,
  id_barbero INT NOT NULL,
  dia_semana TINYINT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_horario_barbero FOREIGN KEY (id_barbero) REFERENCES barberos(id_barbero)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS citas (
  id_cita INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_barberia INT NOT NULL,
  id_barbero INT NOT NULL,
  id_servicio INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('pendiente','confirmada','cancelada','completada') NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cita_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_cita_barberia FOREIGN KEY (id_barberia) REFERENCES barberias(id_barberia),
  CONSTRAINT fk_cita_barbero FOREIGN KEY (id_barbero) REFERENCES barberos(id_barbero),
  CONSTRAINT fk_cita_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio),
  INDEX idx_cita_barbero_fecha (id_barbero, fecha, hora_inicio),
  INDEX idx_cita_usuario_fecha (id_usuario, fecha)
);

CREATE TABLE IF NOT EXISTS calificaciones (
  id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_barberia INT NOT NULL,
  id_cita INT NOT NULL UNIQUE,
  puntuacion INT NOT NULL,
  comentario TEXT,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calif_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_calif_barberia FOREIGN KEY (id_barberia) REFERENCES barberias(id_barberia),
  CONSTRAINT fk_calif_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS recuperaciones (
  id_recuperacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira DATETIME NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_recup_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
