# transactions-service

Microservicio de transacciones para **Centavo**. Registra y categoriza gastos de los usuarios autenticados.

---

## 📁 Estructura

```
transactions-service/
├── src/
│   ├── db/
│   │   └── database.js               # Inicialización y conexión a SQLite
│   ├── middleware/
│   │   └── verifySession.js          # Módulo central de validación de JWT
│   ├── routes/
│   │   └── transaction.routes.js     # Rutas: POST /, GET /, GET /:id
│   ├── controllers/
│   │   └── transaction.controller.js # Lógica de cada endpoint
│   ├── services/
│   │   └── transaction.service.js    # Lógica de negocio y acceso a BD
│   └── app.js                        # Configuración de Express
├── .env.example                      # Variables de entorno necesarias
├── index.js                          # Entry point del servidor
├── package.json
└── README.md
```

---

## 🚀 Endpoints

Todos los endpoints requieren un JWT emitido por `auth-service` en el header:
```
Authorization: Bearer <token>
```

| Método | Ruta                  | Descripción                                          |
|--------|-----------------------|------------------------------------------------------|
| POST   | `/transactions`       | Crea una nueva transacción                           |
| GET    | `/transactions`       | Lista las transacciones del usuario (con filtros)    |
| GET    | `/transactions/:id`   | Obtiene el detalle de una transacción por ID         |
| GET    | `/health`             | Health check del servicio                            |

### POST `/transactions`

**Body JSON:**
```json
{
  "amount": 150.50,
  "category": "alimentacion",
  "description": "Supermercado",
  "date": "2026-10-14"
}
```
- `amount` (requerido): número positivo.
- `category` (requerido): ver categorías válidas más abajo.
- `description` (opcional): texto libre.
- `date` (requerido): formato `YYYY-MM-DD`.

### GET `/transactions`

**Query params opcionales:**
| Param      | Descripción                              | Ejemplo           |
|------------|------------------------------------------|-------------------|
| `category` | Filtra por categoría                     | `?category=salud` |
| `from`     | Fecha mínima (YYYY-MM-DD)               | `?from=2026-01-01`|
| `to`       | Fecha máxima (YYYY-MM-DD)               | `?to=2026-12-31`  |
| `limit`    | Máximo de resultados (default 50, max 200) | `?limit=20`    |
| `offset`   | Paginación                               | `?offset=20`      |

---

## 🏷️ Categorías válidas

`alimentacion`, `transporte`, `vivienda`, `salud`, `entretenimiento`, `educacion`, `ropa`, `servicios`, `otros`

---

## ⚙️ Configuración

1. Copiar `.env.example` a `.env` y completar los valores.
2. Instalar dependencias: `npm install`
3. Iniciar en desarrollo: `npm run dev`
4. Iniciar en producción: `npm start`

> **Importante:** `JWT_SECRET` debe ser el mismo valor que el usado en `auth-service`.

---

## 🔐 Variables de entorno

| Variable      | Descripción                             | Valor por defecto         |
|---------------|-----------------------------------------|---------------------------|
| `PORT`        | Puerto del servidor                     | `3002`                    |
| `JWT_SECRET`  | Secreto JWT (compartido con auth-service) | (requerido)             |
| `DB_PATH`     | Ruta del archivo SQLite                 | `./data/transactions.db`  |
