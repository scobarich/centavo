'use strict';

const express = require('express');
const budgetRoutes = require('./routes/budget.routes');

const app = express();

app.use(express.json());

// Rutas del servicio de presupuestos
app.use('/budgets', budgetRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'budgets-service' });
});

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejador de errores global
app.use((err, _req, res, _next) => {
  console.error('[budgets-service] Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
