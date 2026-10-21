'use strict';

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`[notifications-service] Servidor corriendo en http://localhost:${PORT}`);
});
