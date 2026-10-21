# notifications-service

Microservicio de alertas y notificaciones para **Centavo**. Es responsable de procesar eventos de transacciones, evaluar el consumo frente al presupuesto mensual configurado y disparar alertas de sobregasto preventivas y críticas.

---

## 📁 Estructura

```
notifications-service/
├── data/
│   └── notifications.db          # Base de datos SQLite (creada automáticamente)
├── src/
│   ├── db/
│   │   └── database.js           # Inicialización y conexión a SQLite
│   ├── middleware/
│   │   └── verifySession.js      # Módulo central de validación de JWT y eventos
│   ├── routes/
│   │   └── notification.routes.js# Rutas de eventos y gestión de notificaciones
│   ├── controllers/
│   │   └── notification.controller.js # Lógica de endpoints
│   ├── services/
│   │   └── notification.service.js    # Evaluación de presupuesto y generación de alertas
│   └── app.js                    # Configuración de Express
├── .env.example                  # Variables de entorno requeridas
├── index.js                      # Entry point del servidor
├── package.json
├── AGENTS.md                     # Reglas de desarrollo y directivas para agentes
└── README.md
```

---

## 🚀 Endpoints

### 1. `POST /notifications/events/transaction`
Recibe un evento de nueva transacción para evaluar si se genera una alerta contra el presupuesto del usuario en el mes en curso.

- **Autenticación:** Vía header `Authorization: Bearer <token>` o mediante el campo `userId` en el cuerpo de la petición.
- **Alias:** También disponible en `POST /notifications/events/transaction-created`.

**Body JSON:**
```json
{
  "userId": 1,
  "amount": 120.00,
  "category": "comida",
  "date": "2026-10-20",
  "description": "Cena familiar",
  "currentTotalSpent": 450.00,
  "budgetAmount": 500.00
}
```

*Campos:*
- `amount` (requerido): Monto de la transacción (número positivo).
- `userId` (requerido si no se envía header Bearer).
- `category` (opcional, default `"global"`): Categoría del gasto.
- `date` (opcional, default fecha actual): Fecha en formato `YYYY-MM-DD`.
- `currentTotalSpent` (opcional): Total acumulado antes o con la transacción. Si se omite, se consulta a `transactions-service`.
- `budgetAmount` (opcional): Presupuesto a comparar. Si se omite, se consulta a `budgets-service`.

**Respuesta cuando se genera alerta (201 Created):**
```json
{
  "alertGenerated": true,
  "alert": {
    "id": 1,
    "user_id": 1,
    "type": "budget_exceeded",
    "title": "¡Alerta de sobregasto en comida!",
    "message": "Has superado tu presupuesto de comida para 2026-10. Límite: $500.00, Total gastado: $570.00.",
    "category": "comida",
    "amount": 120,
    "budget_amount": 500,
    "total_spent": 570,
    "month": "2026-10",
    "read": 0,
    "created_at": "2026-10-20 22:15:00"
  },
  "evaluation": {
    "month": "2026-10",
    "category": "comida",
    "budgetCategory": "comida",
    "transactionAmount": 120,
    "totalSpent": 570,
    "budgetAmount": 500,
    "percentage": 114,
    "status": "exceeded"
  }
}
```

---

### 2. `GET /notifications`
Lista las notificaciones del usuario autenticado.

- **Autenticación:** Requiere header `Authorization: Bearer <token>`.
- **Query params opcionales:**
  - `read`: Filtrar por leídas (`1` / `true`) o no leídas (`0` / `false`).
  - `limit`: Límite de resultados (default: 50, máx: 100).
  - `offset`: Paginación.

### 3. `GET /notifications/:id`
Obtiene el detalle de una notificación por ID. Requiere que pertenezca al usuario autenticado.

### 4. `PATCH /notifications/:id/read`
Marca una notificación como leída (`read = 1`).

### 5. `GET /health`
Verifica el estado del servicio (`{ status: "ok", service: "notifications-service" }`).

---

## ⚙️ Configuración

1. Copiar `.env.example` a `.env` y configurar valores:
   ```bash
   cp .env.example .env
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servicio en desarrollo:
   ```bash
   npm run dev
   ```
4. Iniciar en producción:
   ```bash
   npm start
   ```

---

## 🔐 Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto de escucha HTTP | `3004` |
| `JWT_SECRET` | Clave secreta compartida con auth-service | `centavo_dev_secret_replace_in_production` |
| `DB_PATH` | Ruta de la base de datos SQLite local | `./data/notifications.db` |
| `BUDGETS_SERVICE_URL` | URL de `budgets-service` | `http://localhost:3003` |
| `TRANSACTIONS_SERVICE_URL` | URL de `transactions-service` | `http://localhost:3002` |
