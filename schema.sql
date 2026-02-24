CREATE DATABASE IF NOT EXISTS recaudacion_tlapa;
USE recaudacion_tlapa;

-- 1. USUARIOS (Cajeros y Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cajero') NOT NULL DEFAULT 'cajero',
    permiso_agua BOOLEAN DEFAULT FALSE,
    permiso_catastro BOOLEAN DEFAULT FALSE,
    permiso_comercio BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CONTRIBUYENTES (Ciudadanos)
CREATE TABLE IF NOT EXISTS contribuyentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfc VARCHAR(20) NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACTIVOS: PREDIOS
CREATE TABLE IF NOT EXISTS predios_catastro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave_catastral VARCHAR(50) UNIQUE NOT NULL,
    direccion_predio VARCHAR(255) NOT NULL,
    valor_catastral DECIMAL(12, 2) NOT NULL,
    tipo_predio ENUM('urbano', 'rustico') NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    contribuyente_id INT NOT NULL,
    FOREIGN KEY (contribuyente_id) REFERENCES contribuyentes(id) ON DELETE CASCADE
);

-- 4. ACTIVOS: TOMAS DE AGUA
CREATE TABLE IF NOT EXISTS tomas_agua (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_contrato VARCHAR(50) UNIQUE NOT NULL,
    direccion_toma VARCHAR(255) NOT NULL,
    tipo_servicio ENUM('domestico', 'comercial', 'industrial') NOT NULL,
    estado ENUM('activo', 'pausado', 'cancelado') DEFAULT 'activo',
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    contribuyente_id INT NOT NULL,
    FOREIGN KEY (contribuyente_id) REFERENCES contribuyentes(id) ON DELETE CASCADE
);

-- 5. ACTIVOS: LICENCIAS DE COMERCIO
CREATE TABLE IF NOT EXISTS licencias_comercio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_licencia VARCHAR(50) UNIQUE NOT NULL,
    nombre_negocio VARCHAR(150) NOT NULL,
    giro VARCHAR(100) NOT NULL,
    direccion_local VARCHAR(255) NOT NULL,
    estado ENUM('activo', 'pausado', 'cancelado') DEFAULT 'activo',
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    contribuyente_id INT NOT NULL,
    FOREIGN KEY (contribuyente_id) REFERENCES contribuyentes(id) ON DELETE CASCADE
);

-- 6. CONCEPTOS DE COBRO
CREATE TABLE IF NOT EXISTS conceptos_cobro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    area ENUM('agua', 'catastro', 'comercio') NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    calculado BOOLEAN DEFAULT FALSE,
    frecuencia_cobro ENUM('mensual', 'anual', 'unico') NOT NULL DEFAULT 'anual',
    activo BOOLEAN DEFAULT TRUE
);

-- 7. PAGOS (Encabezado)
CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cajero_id INT NOT NULL,
    contribuyente_id INT,
    monto_total DECIMAL(12, 2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    FOREIGN KEY (cajero_id) REFERENCES usuarios(id),
    FOREIGN KEY (contribuyente_id) REFERENCES contribuyentes(id)
);

-- 8. DETALLE DE PAGOS (Relaciona Pagos con Conceptos y Periodos)
CREATE TABLE IF NOT EXISTS pago_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL,
    concepto_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    activo_ref VARCHAR(50),            -- EJ: numero_contrato, clave_catastral
    periodo_inicio DATE,               -- Desde qué fecha cubre este pago (ej: 2026-01-01)
    periodo_fin DATE,                  -- Hasta qué fecha cubre este pago (ej: 2026-01-31 o 2026-12-31)
    anio_fiscal SMALLINT,              -- Año fiscal que se está pagando (ej: 2026)
    mes_fiscal TINYINT,                -- Mes fiscal (1-12), NULL si es pago anual
    FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
    FOREIGN KEY (concepto_id) REFERENCES conceptos_cobro(id)
);

-- 9. HISTORIAL DE MOVIMIENTOS
CREATE TABLE IF NOT EXISTS historial_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    tipo_activo ENUM('predio', 'toma', 'licencia') NOT NULL,
    dueño_anterior_id INT NOT NULL,
    dueño_nuevo_id INT NOT NULL,
    admin_id INT NOT NULL,
    motivo VARCHAR(255),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dueño_anterior_id) REFERENCES contribuyentes(id),
    FOREIGN KEY (dueño_nuevo_id) REFERENCES contribuyentes(id),
    FOREIGN KEY (admin_id) REFERENCES usuarios(id)
);

-- INSERCIÓN DE DATOS INICIALES (MOCK DATA TEMPORAL) PARA PRUEBAS

-- Usuario Administrador Default (Password: admin123)
INSERT INTO usuarios (nombre, email, password, rol, permiso_agua, permiso_catastro, permiso_comercio) 
VALUES ('Admin General', 'admin@tlapa.gob.mx', '$2b$10$rJjRAWCPs/06YMxGum0dreHCMU3x3703LSTzRGyw7kz1U.ujEgGha', 'admin', TRUE, TRUE, TRUE);

-- Cajero de prueba (Password: 12345)
INSERT INTO usuarios (nombre, email, password, rol, permiso_agua, permiso_catastro, permiso_comercio) 
VALUES ('Cajero Agua', 'cajero1@tlapa.gob.mx', '$2b$10$BRdU9Rk.TV15r0oZdoJG..WYq/5K9mEGnPc1rVwMao94leBLV5cWi', 'cajero', TRUE, FALSE, FALSE);

-- Conceptos de Cobro (con frecuencia de cobro para el cálculo de rezago)
INSERT INTO conceptos_cobro (area, nombre, precio, frecuencia_cobro) VALUES 
('agua', 'Mensualidad Abastecimiento de Agua', 150.00, 'mensual'),
('agua', 'Anualidad Abastecimiento de Agua', 1600.00, 'anual'),
('agua', 'Conexión de Agua Potable (Contrato)', 2500.00, 'unico'),
('agua', 'Reconexión de Servicio', 300.00, 'unico'),
('catastro', 'Impuesto Predial Anual', 1200.00, 'anual'),
('catastro', 'Certificado de Valor Catastral', 150.00, 'unico'),
('comercio', 'Refrendo de Licencia Anual', 850.00, 'anual'),
('comercio', 'Permiso de Anuncios', 300.00, 'unico');

-- Contribuyente de prueba
INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email)
VALUES ('GOMR800101XYZ', 'Roberto Gómez Martínez', 'Calle Mina #45, Centro', '7571234567', 'roberto@email.com');

INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, contribuyente_id)
VALUES ('W-12345', 'Calle Mina #45, Centro', 'domestico', 1);

INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, contribuyente_id)
VALUES ('001-002-045', 'Calle Mina #45, Centro', 850000.00, 'urbano', 1);

INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, contribuyente_id)
VALUES ('LIC-2025-001', 'Abarrotes Roberto', 'Abarrotes', 'Calle Mina #45, Centro', 1);
