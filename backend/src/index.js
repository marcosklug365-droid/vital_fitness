import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

import { initSocket } from './lib/socket.js';

import authRoutes from './routes/authRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import planesRoutes from './routes/planesRoutes.js';
import membresiasRoutes from './routes/membresiasRoutes.js';
import pagosRoutes from './routes/pagosRoutes.js';
import clasesRoutes from './routes/clasesRoutes.js';
import inscripcionesRoutes from './routes/inscripcionesRoutes.js';
import asistenciasRoutes from './routes/asistenciasRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Crea una nueva aplicación de Express
const app = express();

// Puerto donde va a correr el servidor, se obtiene de las variables de entorno o se usa el puerto 3000 por defecto
const PORT = process.env.PORT || 3000;

// Middleware globales para parsear JSON y manejar CORS
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite recibir datos en formato JSON

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'Servidor de Vital Fitness funcionando correctamente ✅' });
});

// Rutas de la API
// Todo lo que empiece con /api/auth va al authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/membresias', membresiasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Creamos el servidor HTTP sobre la aplicación de Express.
// Esto permite que Express y Socket.io compartan el mismo puerto.
const httpServer = createServer(app);

// Inicializamos Socket.io sobre el servidor HTTP.
initSocket(httpServer);

// Arranca el servidor HTTP (Express + Socket.io)
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Socket.io listo para conexiones en tiempo real ⚡');
});