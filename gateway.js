'use strict';

/**
 * API Gateway for Centavo - development only.
 * Proxies:
 *   /api/auth/*         → http://localhost:3001/auth/*
 *   /api/transactions/* → http://localhost:3002/transactions/*
 */

const http = require('http');
const https = require('https');

const PORT = 4000;

function proxyRequest(req, res, targetHost, targetPort, targetPath) {
  const options = {
    hostname: targetHost,
    port: targetPort,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${targetHost}:${targetPort}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // CORS headers so the frontend can call this gateway
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[gateway] Upstream error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Bad Gateway: ' + err.message }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = req.url;

  // Pre-flight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  console.log(`[gateway] ${req.method} ${url}`);

  if (url.startsWith('/api/auth')) {
    const targetPath = url.replace('/api/auth', '/auth');
    return proxyRequest(req, res, 'localhost', 3001, targetPath);
  }

  if (url.startsWith('/api/transactions')) {
    const targetPath = url.replace('/api/transactions', '/transactions');
    return proxyRequest(req, res, 'localhost', 3002, targetPath);
  }

  if (url.startsWith('/api/budgets')) {
    const targetPath = url.replace('/api/budgets', '/budgets');
    return proxyRequest(req, res, 'localhost', 3003, targetPath);
  }

  if (url.startsWith('/api/notifications')) {
    const targetPath = url.replace('/api/notifications', '/notifications');
    return proxyRequest(req, res, 'localhost', 3004, targetPath);
  }

  res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ error: 'Route not found in gateway' }));
});

server.listen(PORT, () => {
  console.log(`[gateway] API Gateway running on http://localhost:${PORT}`);
  console.log(`[gateway]   /api/auth/*         -> http://localhost:3001`);
  console.log(`[gateway]   /api/transactions/* -> http://localhost:3002`);
  console.log(`[gateway]   /api/budgets/*      -> http://localhost:3003`);
  console.log(`[gateway]   /api/notifications/* -> http://localhost:3004`);
});
