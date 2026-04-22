import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { updateActivo, transferirActivo } from '../controllers/activos.controller.js';

const router = express.Router();

router.put('/:tipo/:id', authenticateToken, updateActivo);
router.post('/transferir', authenticateToken, transferirActivo);

export default router;
