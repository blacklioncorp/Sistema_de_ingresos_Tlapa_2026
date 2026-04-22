import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getCajeros, createCajero, updateCajero, deleteCajero } from '../controllers/cajeros.controller.js';

const router = express.Router();

router.get('/', authenticateToken, getCajeros);
router.post('/', authenticateToken, createCajero);
router.put('/:id', authenticateToken, updateCajero);
router.delete('/:id', authenticateToken, deleteCajero);

export default router;
