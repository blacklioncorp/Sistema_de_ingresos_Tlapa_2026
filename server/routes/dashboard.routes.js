import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getEstadisticas, getActividadReciente } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/stats', authenticateToken, getEstadisticas);
router.get('/actividad', authenticateToken, getActividadReciente);

export default router;
