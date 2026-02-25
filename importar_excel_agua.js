import xlsx from 'xlsx';
import mysql from 'mysql2/promise';

// Configuración de la Base de Datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Ajusta si tienes contraseña
    database: 'recaudacion_tlapa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const filePath = 'E:\\Stivi\\001 TRABAJOS\\INGRESOS\\importante\\Agua Potable B 2026.xlsx';

async function importarDatos() {
    console.log("Iniciando importación desde Excel...");

    // 1. Conectar a MariaDB
    const pool = mysql.createPool(dbConfig);
    console.log("Conectado a la base de datos.");

    // 2. Leer Excel
    console.log(`Leyendo archivo: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    console.log(`Comenzando a procesar ${data.length} registros. Esto puede tomar varios minutos...`);

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        // Mapear Columnas
        const contrato = row['REGISTRO'] ? String(row['REGISTRO']).trim() : `S/N-${i}`;
        const nombre = row['NOMBRE'] ? String(row['NOMBRE']).trim().toUpperCase() : 'SIN NOMBRE';
        const calle = row['CALLE'] ? String(row['CALLE']).trim() : '';
        const colonia = row['COLONIA'] ? String(row['COLONIA']).trim() : '';
        const direccionCompleta = `${calle} ${colonia}`.trim() || 'Desconocida';

        // No tenemos tarifas directas pero podemos guardarla en notas o asumir 'domestico'
        const tarifa = row['TARIFA'] || '';
        const nota = row['NOTA'] || '';
        const ultimoPago = row['ULTIMO PAGO'] ? String(row['ULTIMO PAGO']).trim() : null;

        try {
            // A. Buscar o Insertar Contribuyente
            let contribuyenteId;
            const [existingUser] = await pool.query('SELECT id FROM contribuyentes WHERE nombre_completo = ? LIMIT 1', [nombre]);

            if (existingUser.length > 0) {
                contribuyenteId = existingUser[0].id;
            } else {
                const fakeRfc = `${i}-SN-${Date.now()}`.substring(0, 20);
                const [resultUser] = await pool.query(
                    'INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)',
                    [fakeRfc, nombre, direccionCompleta, '', '']
                );
                contribuyenteId = resultUser.insertId;
            }

            // B. Buscar o Insertar Toma de Agua
            const [existingToma] = await pool.query('SELECT id FROM tomas_agua WHERE numero_contrato = ?', [contrato]);

            if (existingToma.length === 0) {
                await pool.query(
                    'INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, contribuyente_id, ultimo_pago_historico) VALUES (?, ?, ?, ?, ?)',
                    [contrato, direccionCompleta, 'domestico', contribuyenteId, ultimoPago]
                );
                insertados++;
            } else {
                // Actualizar la toma existente con la dirección y el último pago
                await pool.query(
                    'UPDATE tomas_agua SET direccion_toma = ?, ultimo_pago_historico = ? WHERE numero_contrato = ?',
                    [direccionCompleta, ultimoPago, contrato]
                );
                actualizados++;
            }

            // Barra de progreso simple cada 1000 registros
            if ((i + 1) % 1000 === 0) {
                console.log(`Progreso: ${i + 1} de ${data.length} procesados...`);
            }

        } catch (error) {
            console.error(`Error en la fila ${i + 1} (Contrato ${contrato}):`, error.message);
            errores++;
        }
    }

    console.log('=============================================');
    console.log('IMPORTACIÓN FINALIZADA');
    console.log(`Nuevas tomas/contratos insertados: ${insertados}`);
    console.log(`Contratos ya existentes ignorados: ${actualizados}`);
    console.log(`Errores durante la importación: ${errores}`);
    console.log('=============================================');

    // Cerrar el pool de base de datos
    await pool.end();
}

importarDatos();
