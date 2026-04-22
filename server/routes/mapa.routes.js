import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getCobertura } from '../controllers/mapa.controller.js';

const router = express.Router();

router.get('/cobertura', authenticateToken, getCobertura);

export default router;
