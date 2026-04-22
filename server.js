import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.routes.js';
import dashboardRoutes from './server/routes/dashboard.routes.js';
import reportesRoutes from './server/routes/reportes.routes.js';
import conceptosRoutes from './server/routes/conceptos.routes.js';
import contribuyentesRoutes from './server/routes/contribuyentes.routes.js';
import cajerosRoutes from './server/routes/cajeros.routes.js';
import pagosRoutes from './server/routes/pagos.routes.js';
import activosRoutes from './server/routes/activos.routes.js';
import mapaRoutes from './server/routes/mapa.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/conceptos', conceptosRoutes);
app.use('/api/contribuyentes', contribuyentesRoutes);
app.use('/api/cajeros', cajerosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/activos', activosRoutes);
app.use('/api/mapa', mapaRoutes);

import { startSyncWorker } from './server/sync-worker.js';

const PORT = process.env.PORT || 3001;
startSyncWorker();
app.listen(PORT, () => console.log(`Servidor de Recaudación Tlapa corriendo en http://localhost:${PORT}`));
