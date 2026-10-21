'use strict';

const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(express.json());

// Rutas del servicio de autenticación
app.use('/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejador de errores global (no expone stack traces)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[auth-service] Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
