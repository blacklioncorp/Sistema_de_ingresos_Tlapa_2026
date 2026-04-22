-- ESTRUCTURA DE BASE DE DATOS LOCAL POSTGRESQL PARA SINCRONIZACIÓN SUPABASE
-- IMPORTANTE: Ya no ejecutamos CREATE DATABASE ni USE, en PostgreSQL 
-- te conectas directamente a una base de datos.
-- Puedes crearla en terminal con: createdb recaudacion_tlapa

-- 1. USUARIOS (Cajeros y Administradores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending' o 'synced'
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('admin', 'cajero')) NOT NULL DEFAULT 'cajero',
    permiso_agua BOOLEAN DEFAULT FALSE,
    permiso_catastro BOOLEAN DEFAULT FALSE,
    permiso_comercio BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 2. CONTRIBUYENTES (Ciudadanos)
CREATE TABLE contribuyentes (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    rfc VARCHAR(20) NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 3. ACTIVOS: PREDIOS
CREATE TABLE predios_catastro (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    clave_catastral VARCHAR(50) UNIQUE NOT NULL,
    direccion_predio VARCHAR(255) NOT NULL,
    valor_catastral NUMERIC(12, 2) NOT NULL,
    tipo_predio VARCHAR(20) CHECK (tipo_predio IN ('urbano', 'rustico')) NOT NULL,
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    contribuyente_id INTEGER NOT NULL REFERENCES contribuyentes(id) ON DELETE CASCADE
);

-- 4. ACTIVOS: TOMAS DE AGUA
CREATE TABLE tomas_agua (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    numero_contrato VARCHAR(50) UNIQUE NOT NULL,
    direccion_toma VARCHAR(255) NOT NULL,
    tipo_servicio VARCHAR(20) CHECK (tipo_servicio IN ('domestico', 'comercial', 'industrial')) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('activo', 'pausado', 'cancelado')) DEFAULT 'activo',
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    contribuyente_id INTEGER NOT NULL REFERENCES contribuyentes(id) ON DELETE CASCADE
);

-- 5. ACTIVOS: LICENCIAS DE COMERCIO
CREATE TABLE licencias_comercio (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    numero_licencia VARCHAR(50) UNIQUE NOT NULL,
    nombre_negocio VARCHAR(150) NOT NULL,
    giro VARCHAR(100) NOT NULL,
    direccion_local VARCHAR(255) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('activo', 'pausado', 'cancelado')) DEFAULT 'activo',
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    contribuyente_id INTEGER NOT NULL REFERENCES contribuyentes(id) ON DELETE CASCADE
);

-- 6. CONCEPTOS DE COBRO
CREATE TABLE conceptos_cobro (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    clave VARCHAR(50) UNIQUE NOT NULL,
    area VARCHAR(20) CHECK (area IN ('agua', 'catastro', 'comercio')) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    calculado BOOLEAN DEFAULT FALSE,
    frecuencia_cobro VARCHAR(20) CHECK (frecuencia_cobro IN ('mensual', 'anual', 'unico')) NOT NULL DEFAULT 'anual',
    activo BOOLEAN DEFAULT TRUE
);

-- 7. PAGOS (Encabezado)
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    cajero_id INTEGER NOT NULL REFERENCES usuarios(id),
    contribuyente_id INTEGER REFERENCES contribuyentes(id),
    monto_total NUMERIC(12, 2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    notas TEXT
);

-- 8. DETALLE DE PAGOS
CREATE TABLE pago_detalles (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    pago_id INTEGER NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
    concepto_id INTEGER NOT NULL REFERENCES conceptos_cobro(id),
    monto NUMERIC(10, 2) NOT NULL,
    activo_ref VARCHAR(50),
    periodo_inicio DATE,
    periodo_fin DATE,
    anio_fiscal SMALLINT,
    mes_fiscal SMALLINT
);

-- 9. HISTORIAL DE MOVIMIENTOS
CREATE TABLE historial_movimientos (
    id SERIAL PRIMARY KEY,
    cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    activo_id INTEGER NOT NULL,
    tipo_activo VARCHAR(20) CHECK (tipo_activo IN ('predio', 'toma', 'licencia')) NOT NULL,
    dueño_anterior_id INTEGER NOT NULL REFERENCES contribuyentes(id),
    dueño_nuevo_id INTEGER NOT NULL REFERENCES contribuyentes(id),
    admin_id INTEGER NOT NULL REFERENCES usuarios(id),
    motivo VARCHAR(255),
    fecha_movimiento TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- DATOS SEED INICIALES (MOCK DATA TEMPORAL) PARA PRUEBAS
-- IMPORTANTE: en Postgres usamos cadenas simples en vez de dobles, etc.
-- ==========================================

-- Admin (Password: admin123)
INSERT INTO usuarios (nombre, email, password, rol, permiso_agua, permiso_catastro, permiso_comercio) 
VALUES ('Admin General', 'admin@tlapa.gob.mx', '$2b$10$rJjRAWCPs/06YMxGum0dreHCMU3x3703LSTzRGyw7kz1U.ujEgGha', 'admin', TRUE, TRUE, TRUE);

-- Cajero (Password: 12345)
INSERT INTO usuarios (nombre, email, password, rol, permiso_agua, permiso_catastro, permiso_comercio) 
VALUES ('Cajero Agua', 'cajero1@tlapa.gob.mx', '$2b$10$BRdU9Rk.TV15r0oZdoJG..WYq/5K9mEGnPc1rVwMao94leBLV5cWi', 'cajero', TRUE, FALSE, FALSE);

-- Conceptos de Cobro
INSERT INTO conceptos_cobro (clave, area, nombre, precio, frecuencia_cobro) VALUES 
('AGUA-MENS', 'agua', 'Mensualidad Abastecimiento de Agua', 150.00, 'mensual'),
('AGUA-ANUAL', 'agua', 'Anualidad Abastecimiento de Agua', 1600.00, 'anual'),
('AGUA-CONX', 'agua', 'Conexión de Agua Potable (Contrato)', 2500.00, 'unico'),
('AGUA-RECONX', 'agua', 'Reconexión de Servicio', 300.00, 'unico'),
('CAT-PRED', 'catastro', 'Impuesto Predial Anual', 1200.00, 'anual'),
('CAT-CERT', 'catastro', 'Certificado de Valor Catastral', 150.00, 'unico'),
('COM-REF', 'comercio', 'Refrendo de Licencia Anual', 850.00, 'anual'),
('COM-ANUNC', 'comercio', 'Permiso de Anuncios', 300.00, 'unico');

-- Contribuyente de prueba
INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email)
VALUES ('GOMR800101XYZ', 'Roberto Gómez Martínez', 'Calle Mina #45, Centro', '7571234567', 'roberto@email.com');

INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, contribuyente_id)
VALUES ('W-12345', 'Calle Mina #45, Centro', 'domestico', 1);

INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, contribuyente_id)
VALUES ('001-002-045', 'Calle Mina #45, Centro', 850000.00, 'urbano', 1);

INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, contribuyente_id)
VALUES ('LIC-2025-001', 'Abarrotes Roberto', 'Abarrotes', 'Calle Mina #45, Centro', 1);
