// API Client Service
// Responsable de todas las comunicaciones HTTP con el Servidor Node

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Realiza las peticiones al servidor, centralizando el manejo de errores.
 */
async function fetchClient(endpoint: string, options: RequestInit = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error en la petición');
        return data;
    } catch (error: any) {
        console.error(`Error en API - ${endpoint}:`, error.message);
        throw error;
    }
}

export const api = {
    // ---- Autenticación ----
    login: (credenciales: any) => fetchClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credenciales),
    }),

    // ---- Contribuyentes ----
    getContribuyentes: () => fetchClient('/contribuyentes'),

    getContribuyenteCompleto: (query: string) => fetchClient(`/contribuyentes/busqueda/${encodeURIComponent(query)}`),

    crearContribuyente: (datos: any) => fetchClient('/contribuyentes', {
        method: 'POST',
        body: JSON.stringify(datos)
    }),

    // ---- Catálogos ----
    getConceptosPorArea: (area: string) => fetchClient(`/conceptos/${area}`),

    // ---- Transacciones / Pagos ----
    procesarPago: (pagoData: any) => fetchClient('/pagos/procesar', {
        method: 'POST',
        body: JSON.stringify(pagoData)
    }),

    // ---- Procesos Administrativos ----
    transferirActivo: (datos: any) => fetchClient('/activos/transferir', {
        method: 'POST',
        body: JSON.stringify(datos)
    })
};
