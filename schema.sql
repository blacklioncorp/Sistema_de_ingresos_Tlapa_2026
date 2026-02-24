
CREATE DATABASE IF NOT EXISTS recaudacion_tlapa;
USE recaudacion_tlapa;

-- ... (Tablas anteriores se mantienen) ...

-- 7. TABLA DE AUDITORÍA: HISTORIAL DE MOVIMIENTOS Y TRANSFERENCIAS
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
    FOREIGN KEY (dueño_nuevo_id) REFERENCES contribuyentes(id)
);
