'use strict';

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[transactions-service] Servidor corriendo en http://localhost:${PORT}`);
});
