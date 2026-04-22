import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getReportes } from '../controllers/reportes.controller.js';

const router = express.Router();

router.get('/', authenticateToken, getReportes);

export default router;
