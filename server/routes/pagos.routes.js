import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { procesarPago } from '../controllers/pagos.controller.js';

const router = express.Router();

router.post('/procesar', authenticateToken, procesarPago);

export default router;
