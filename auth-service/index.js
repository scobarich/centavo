'use strict';

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[auth-service] Servidor corriendo en http://localhost:${PORT}`);
});
