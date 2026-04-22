import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { 
    getContribuyentes, 
    getContribuyenteBusquedaUnico, 
    getContribuyenteBusquedaMulti, 
    getContribuyenteById, 
    createContribuyente, 
    deleteContribuyente, 
    updateContribuyente, 
    createActivoContribuyente, 
    getEstadoContribuyente 
} from '../controllers/contribuyentes.controller.js';

const router = express.Router();

router.get('/', authenticateToken, getContribuyentes);
router.post('/', authenticateToken, createContribuyente);
router.get('/busqueda/:query', authenticateToken, getContribuyenteBusquedaUnico);
router.get('/busqueda/multi/:query', authenticateToken, getContribuyenteBusquedaMulti);
router.get('/:id', authenticateToken, getContribuyenteById);
router.delete('/:id', authenticateToken, deleteContribuyente);
router.put('/:id', authenticateToken, updateContribuyente);
router.post('/:id/activos/:tipo', authenticateToken, createActivoContribuyente);
router.get('/estado/:id', authenticateToken, getEstadoContribuyente);

export default router;
