import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { 
    buscarAdeudosUniversal, 
    crearReferencia, 
    obtenerReferenciaPorFolio 
} from '../controllers/kiosco.controller.js';

const router = express.Router();

// Rutas públicas de Kiosco
router.get('/buscar', buscarAdeudosUniversal);
router.post('/referencia', crearReferencia);

// Ruta privada (requiere autenticación de cajero) para recuperar el ticket en ventanilla
router.get('/referencia/:folio', authenticateToken, obtenerReferenciaPorFolio);

export default router;
