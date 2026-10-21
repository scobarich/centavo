# auth-service

Microservicio de autenticación para **Centavo**. Gestiona el registro de usuarios, el inicio de sesión y la verificación de sesión mediante JWT.

---

## 🛡️ Reglas de seguridad del servicio

1. **Nunca** se loguean credenciales, tokens ni hashes en texto plano — ni en consola ni en logs de archivo.
2. **Toda** validación de sesión pasa por el módulo central `src/middleware/verifySession.js`. No se valida JWT en otro lugar.
3. El hashing de contraseñas usa **bcrypt con cost factor 12**. Cualquier cambio a este valor requiere justificación explícita en el plan antes de ejecutarse (ver `AGENTS.md`).
4. Los secretos (`JWT_SECRET`) viven exclusivamente en `.env` y nunca se commitean al repositorio.

---

## 📁 Estructura

```
auth-service/
├── src/
│   ├── db/
│   │   └── database.js          # Inicialización y conexión a SQLite
│   ├── middleware/
│   │   └── verifySession.js     # Módulo central de validación de JWT
│   ├── routes/
│   │   └── auth.routes.js       # Rutas: /register, /login, /me
│   ├── controllers/
│   │   └── auth.controller.js   # Lógica de cada endpoint
│   ├── services/
│   │   └── auth.service.js      # Lógica de negocio (hashing, tokens)
│   └── app.js                   # Configuración de Express
├── .env.example                 # Variables de entorno necesarias
├── index.js                     # Entry point del servidor
├── package.json
└── README.md
```

---

## 🚀 Endpoints

| Método | Ruta            | Descripción                              | Auth requerida |
|--------|-----------------|------------------------------------------|----------------|
| POST   | `/auth/register`| Registra un nuevo usuario               | No             |
| POST   | `/auth/login`   | Inicia sesión, devuelve JWT             | No             |
| GET    | `/auth/me`      | Verifica sesión activa y devuelve datos | Sí (JWT)       |

---

## ⚙️ Configuración

1. Copiar `.env.example` a `.env` y completar los valores.
2. Instalar dependencias: `npm install`
3. Iniciar en desarrollo: `npm run dev`
4. Iniciar en producción: `npm start`

---

## 🔐 Variables de entorno

| Variable      | Descripción                          | Valor por defecto |
|---------------|--------------------------------------|-------------------|
| `PORT`        | Puerto del servidor                  | `3001`            |
| `JWT_SECRET`  | Secreto para firmar JWT              | (requerido)       |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token   | `7d`              |
| `DB_PATH`     | Ruta del archivo SQLite              | `./data/auth.db`  |
