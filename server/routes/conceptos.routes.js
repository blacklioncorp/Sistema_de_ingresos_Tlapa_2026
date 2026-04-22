import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getConceptos, getConceptosByArea, createConcepto, updateConcepto, deleteConcepto } from '../controllers/conceptos.controller.js';

const router = express.Router();

router.get('/', authenticateToken, getConceptos);
router.post('/', authenticateToken, createConcepto);
router.get('/:area', authenticateToken, getConceptosByArea);
router.put('/:id', authenticateToken, updateConcepto);
router.delete('/:id', authenticateToken, deleteConcepto);

export default router;
