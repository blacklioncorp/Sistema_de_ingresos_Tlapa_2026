import express from 'express';
import { loginUsuario } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', loginUsuario);

export default router;
