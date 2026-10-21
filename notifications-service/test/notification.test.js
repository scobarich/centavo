'use strict';

const { test, describe, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, 'test.db');
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test_secret_for_notifications';

const notificationService = require('../src/services/notification.service');
const notificationController = require('../src/controllers/notification.controller');
const db = require('../src/db/database');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('notifications-service: Evaluación de sobregasto', () => {
  const testUserId = 999;
  const currentMonth = new Date().toISOString().slice(0, 7);

  after(() => {
    try {
      db.close();
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
      if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
    } catch {
      // Ignorar errores de limpieza
    }
  });

  test('Genera alerta de tipo budget_exceeded si el gasto supera el presupuesto', async () => {
    const result = await notificationService.evaluateTransaction(testUserId, {
      amount: 150,
      category: 'comida',
      date: `${currentMonth}-15`,
      currentTotalSpent: 400, // 400 + 150 = 550
      budgetAmount: 500,     // Supera los 500
    });

    assert.strictEqual(result.alertGenerated, true);
    assert.strictEqual(result.evaluation.status, 'exceeded');
    assert.strictEqual(result.alert.type, 'budget_exceeded');
    assert.strictEqual(result.alert.user_id, testUserId);
    assert.strictEqual(result.alert.total_spent, 550);
    assert.strictEqual(result.alert.budget_amount, 500);
  });

  test('Genera alerta preventiva budget_warning si alcanza el 80% o más del presupuesto', async () => {
    const result = await notificationService.evaluateTransaction(testUserId, {
      amount: 50,
      category: 'transporte',
      date: `${currentMonth}-10`,
      currentTotalSpent: 380, // 380 + 50 = 430 de 500 = 86%
      budgetAmount: 500,
    });

    assert.strictEqual(result.alertGenerated, true);
    assert.strictEqual(result.evaluation.status, 'warning');
    assert.strictEqual(result.alert.type, 'budget_warning');
    assert.strictEqual(result.alert.total_spent, 430);
  });

  test('NO genera alerta si el gasto total está por debajo del 80% del presupuesto', async () => {
    const result = await notificationService.evaluateTransaction(testUserId, {
      amount: 100,
      category: 'entretenimiento',
      date: `${currentMonth}-05`,
      currentTotalSpent: 100, // 100 + 100 = 200 de 500 = 40%
      budgetAmount: 500,
    });

    assert.strictEqual(result.alertGenerated, false);
    assert.strictEqual(result.evaluation.status, 'ok');
    assert.strictEqual(result.alert, undefined);
  });

  test('Listar notificaciones y marcar como leída en el servicio', () => {
    const notifications = notificationService.list(testUserId);
    assert.ok(notifications.length >= 2);

    const first = notifications[0];
    assert.strictEqual(first.read, 0);

    const updated = notificationService.markAsRead(first.id, testUserId);
    assert.strictEqual(updated.read, 1);
  });

  test('Controller: POST /notifications/events/transaction procesa evento correctamente', async () => {
    const req = {
      body: {
        userId: testUserId,
        amount: 250,
        category: 'salud',
        currentTotalSpent: 400,
        budgetAmount: 500,
      },
      headers: {},
    };
    const res = createMockRes();

    await notificationController.processTransactionEvent(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.alertGenerated, true);
    assert.strictEqual(res.body.alert.type, 'budget_exceeded');
  });

  test('Controller: GET /notifications lista las notificaciones del usuario', () => {
    const req = {
      user: { id: testUserId },
      query: {},
    };
    const res = createMockRes();

    notificationController.list(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.notifications));
    assert.ok(res.body.notifications.length >= 3);
  });

  test('Controller: PATCH /notifications/:id/read marca como leída', () => {
    const reqList = { user: { id: testUserId }, query: {} };
    const resList = createMockRes();
    notificationController.list(reqList, resList);
    const targetId = resList.body.notifications[0].id;

    const req = {
      user: { id: testUserId },
      params: { id: String(targetId) },
    };
    const res = createMockRes();

    notificationController.markAsRead(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.notification.read, 1);
  });

  test('Controller: POST /notifications/events/transaction valida campos obligatorios', async () => {
    // Falta userId
    const reqSinUser = { body: { amount: 100 }, headers: {} };
    const resSinUser = createMockRes();
    await notificationController.processTransactionEvent(reqSinUser, resSinUser);
    assert.strictEqual(resSinUser.statusCode, 400);

    // Falta amount
    const reqSinAmount = { body: { userId: testUserId }, headers: {} };
    const resSinAmount = createMockRes();
    await notificationController.processTransactionEvent(reqSinAmount, resSinAmount);
    assert.strictEqual(resSinAmount.statusCode, 400);

    // Monto no positivo
    const reqMontoInvalido = { body: { userId: testUserId, amount: -50 }, headers: {} };
    const resMontoInvalido = createMockRes();
    await notificationController.processTransactionEvent(reqMontoInvalido, resMontoInvalido);
    assert.strictEqual(resMontoInvalido.statusCode, 400);
  });

  test('Seguridad: getById deniega acceso a notificaciones de otro usuario', () => {
    const reqList = { user: { id: testUserId }, query: {} };
    const resList = createMockRes();
    notificationController.list(reqList, resList);
    const targetId = resList.body.notifications[0].id;

    const reqOtroUsuario = {
      user: { id: 8888 }, // Usuario diferente
      params: { id: String(targetId) },
    };
    const resOtroUsuario = createMockRes();
    notificationController.getById(reqOtroUsuario, resOtroUsuario);

    assert.strictEqual(resOtroUsuario.statusCode, 403);
    assert.strictEqual(resOtroUsuario.body.error, 'Acceso denegado.');
  });

  test('Evaluar transacción sin presupuesto configurado', async () => {
    const result = await notificationService.evaluateTransaction(testUserId, {
      amount: 100,
      category: 'categoria_inexistente',
      budgetAmount: 0,
    });

    assert.strictEqual(result.alertGenerated, false);
    assert.strictEqual(result.evaluation.status, 'no_budget');
  });
});
