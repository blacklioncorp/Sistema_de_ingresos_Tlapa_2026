// API Client Service
// Responsable de todas las comunicaciones HTTP con el Servidor Node

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Realiza las peticiones al servidor, centralizando el manejo de errores.
 */
async function fetchClient(endpoint: string, options: RequestInit = {}) {
    try {
        const token = localStorage.getItem('tlapa_token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

    // ---- Dashboard ----
    getDashboardStats: () => fetchClient('/dashboard/stats'),
    getDashboardActividad: () => fetchClient('/dashboard/actividad'),

    // ---- Reportes ----
    getReportes: (desde?: string, hasta?: string) => {
        const params = new URLSearchParams();
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);
        return fetchClient(`/reportes?${params.toString()}`);
    },

    // ---- Contribuyentes ----
    getContribuyentes: (query?: string) => {
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        return fetchClient(`/contribuyentes?${params.toString()}`);
    },

    getContribuyenteCompleto: (query: string) => fetchClient(`/contribuyentes/busqueda/${encodeURIComponent(query)}`),

    buscarContribuyentesMulti: (query: string) => fetchClient(`/contribuyentes/busqueda/multi/${encodeURIComponent(query)}`),

    getContribuyentePorId: (id: number | string) => fetchClient(`/contribuyentes/${id}`),

    crearContribuyente: (datos: any) => fetchClient('/contribuyentes', {
        method: 'POST',
        body: JSON.stringify(datos)
    }),

    actualizarContribuyente: (id: number, datos: any) => fetchClient(`/contribuyentes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    }),

    eliminarContribuyente: (id: number) => fetchClient(`/contribuyentes/${id}`, {
        method: 'DELETE'
    }),

    crearActivo: (contribuyente_id: number, tipo_activo: 'agua' | 'catastro' | 'comercio', datos: any) =>
        fetchClient(`/contribuyentes/${contribuyente_id}/activos/${tipo_activo}`, {
            method: 'POST',
            body: JSON.stringify(datos)
        }),

    actualizarActivo: (tipo_activo: 'agua' | 'catastro' | 'comercio', id: number, datos: any) =>
        fetchClient(`/activos/${tipo_activo}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(datos)
        }),

    // ---- Catálogos ----
    getConceptosPorArea: (area: string) => fetchClient(`/conceptos/${area}`),

    getConceptos: () => fetchClient('/conceptos'),

    crearConcepto: (datos: any) => fetchClient('/conceptos', {
        method: 'POST',
        body: JSON.stringify(datos)
    }),

    // ---- Estado de Pago (Al corriente / Rezagado) ----
    getEstadoPago: (contribuyenteId: number) => fetchClient(`/contribuyentes/estado/${contribuyenteId}`),

    // ---- Cajeros (CRUD) ----
    getCajeros: () => fetchClient('/cajeros'),

    crearCajero: (datos: { nombre: string; email: string; password: string; permiso_agua: boolean; permiso_catastro: boolean; permiso_comercio: boolean }) =>
        fetchClient('/cajeros', { method: 'POST', body: JSON.stringify(datos) }),

    actualizarCajero: (id: number, datos: any) =>
        fetchClient(`/cajeros/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),

    eliminarCajero: (id: number) =>
        fetchClient(`/cajeros/${id}`, { method: 'DELETE' }),

    // ---- Transacciones / Pagos ----
    procesarPago: (pagoData: any) => fetchClient('/pagos/procesar', {
        method: 'POST',
        body: JSON.stringify(pagoData)
    }),

    // ---- Procesos Administrativos ----
    transferirActivo: (datos: any) => fetchClient('/activos/transferir', {
        method: 'POST',
        body: JSON.stringify(datos)
    }),

    // --- Conceptos (Nuevos Endpoints) ---
    actualizarConcepto: (id: number, datos: any) => fetchClient(`/conceptos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    }),
    eliminarConcepto: (id: number) => fetchClient(`/conceptos/${id}`, {
        method: 'DELETE'
    }),

    // --- Mapa de Cobertura ---
    obtenerCobertura: () => fetchClient('/mapa/cobertura')
};
