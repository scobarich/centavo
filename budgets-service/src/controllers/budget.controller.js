'use strict';

const budgetService = require('../services/budget.service');

function get(req, res) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = req.query.month || currentMonth;
  const category = req.query.category || 'global';

  try {
    const budget = budgetService.getBudget(req.user.id, month, category);
    return res.status(200).json({ budget: budget || { month, amount: 0, category } });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

function save(req, res) {
  const { month, amount, category } = req.body;
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (amount === undefined) {
    return res.status(400).json({ error: 'amount es requerido.' });
  }

  try {
    const budget = budgetService.setBudget(req.user.id, {
      month: month || currentMonth,
      amount: Number(amount),
      category: category || 'global',
    });
    return res.status(200).json({
      message: 'Presupuesto actualizado exitosamente.',
      budget,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { get, save };
