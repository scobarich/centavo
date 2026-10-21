import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TransactionList } from '../components/transactions/TransactionList';
import { useTransactions } from '../hooks/useTransactions';
import { transactionService } from '../services/transactionService';
import { budgetService } from '../services/budgetService';

/**
 * Pantalla principal del Dashboard de Centavo con gestión de presupuestos y métricas en tiempo real.
 */
export function Dashboard({ user, onLogout }) {
  const { transactions, isLoading, refreshTransactions } = useTransactions();

  // Estados de formularios y modales
  const [showTxForm, setShowTxForm] = useState(false);
  const [txFormData, setTxFormData] = useState({
    amount: '',
    category: 'Comida',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [txFormError, setTxFormError] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Estados de Presupuesto Mensual
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  const CATEGORIES = ['Comida', 'Transporte', 'Vivienda', 'Salud', 'Ocio', 'Educación', 'Ropa', 'Otros'];

  // Cargar presupuesto mensual al iniciar
  useEffect(() => {
    async function loadBudget() {
      try {
        const budget = await budgetService.getMonthlyBudget();
        setMonthlyBudget(budget);
      } catch (err) {
        console.error('Error cargando presupuesto:', err);
      }
    }
    loadBudget();
  }, []);

  // Cálculos dinámicos de métricas en base a transacciones reales
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const { totalExpensesMonth, expensesCount, totalIncome } = useMemo(() => {
    let expenses = 0;
    let count = 0;
    let income = 0;

    for (const tx of transactions) {
      const isCurrentMonth = !tx.date || tx.date.startsWith(currentMonth);
      const amount = Math.abs(Number(tx.amount) || 0);

      if (tx.type === 'income') {
        if (isCurrentMonth) income += amount;
      } else {
        if (isCurrentMonth) {
          expenses += amount;
          count += 1;
        }
      }
    }

    return { totalExpensesMonth: expenses, expensesCount: count, totalIncome: income };
  }, [transactions, currentMonth]);

  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalExpensesMonth : 0;
  const usagePercent = monthlyBudget > 0 ? Math.round((totalExpensesMonth / monthlyBudget) * 100) : 0;
  const totalBalance = monthlyBudget > 0 ? remainingBudget + totalIncome : totalIncome - totalExpensesMonth;

  // Handlers para Transacciones
  const handleNewTransaction = () => {
    setTxFormData({
      amount: '',
      category: 'Comida',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setTxFormError('');
    setShowTxForm(true);
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setTxFormError('');
    const amount = Number(txFormData.amount);
    if (!amount || isNaN(amount)) {
      setTxFormError('Ingresa un monto válido.');
      return;
    }
    if (!txFormData.date) {
      setTxFormError('Selecciona una fecha.');
      return;
    }

    setTxSubmitting(true);
    const cleanCat = txFormData.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const categoryMap = { ocio: 'entretenimiento' };
    const backendCategory = categoryMap[cleanCat] || cleanCat;

    try {
      await transactionService.createTransaction({
        amount: Math.abs(amount),
        category: backendCategory,
        description: txFormData.description || txFormData.category,
        date: txFormData.date,
      });
      setShowTxForm(false);
      refreshTransactions();
    } catch (err) {
      setTxFormError(err.message || 'Error al registrar la transacción.');
    } finally {
      setTxSubmitting(false);
    }
  };

  // Handlers para Presupuesto
  const handleOpenBudgetModal = () => {
    setBudgetInput(monthlyBudget > 0 ? String(monthlyBudget) : '');
    setBudgetError('');
    setShowBudgetModal(true);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setBudgetError('');
    const val = Number(budgetInput);
    if (isNaN(val) || val <= 0) {
      setBudgetError('Ingresa un monto de presupuesto válido mayor a 0.');
      return;
    }

    setSavingBudget(true);
    try {
      const saved = await budgetService.setMonthlyBudget(val);
      setMonthlyBudget(saved);
      setShowBudgetModal(false);
    } catch (err) {
      setBudgetError(err.message || 'Error al guardar el presupuesto.');
    } finally {
      setSavingBudget(false);
    }
  };

  // Estilos
  const metricsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)',
  };

  const metricLabelStyle = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600',
  };

  const metricValueStyle = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: '800',
    color: 'var(--color-text-primary)',
    marginTop: 'var(--space-xs)',
  };

  const metricSubtitleStyle = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-xs)',
  };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  };

  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' };
  const labelStyle = { fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-text-primary)' };
  const inputStyle = {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-base)',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
  };

  const formatCurrency = (amount) => {
    return '$' + Math.abs(amount).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Navbar user={user} onLogout={onLogout} />

      {/* Modal para Modificar / Definir Presupuesto Mensual */}
      {showBudgetModal && (
        <div style={overlayStyle} onClick={() => setShowBudgetModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: '700', fontSize: 'var(--font-size-lg)' }}>
              🎯 Presupuesto Mensual
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Define el límite de gasto total para este mes ({currentMonth}). Se usará para calcular tu saldo disponible y emitir alertas.
            </p>

            {budgetError && (
              <div
                style={{
                  color: 'var(--color-danger)',
                  background: 'var(--color-danger-light)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {budgetError}
              </div>
            )}

            <form onSubmit={handleBudgetSubmit}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="budget-amount">
                  Monto del Presupuesto Mensual ($)
                </label>
                <input
                  id="budget-amount"
                  style={inputStyle}
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Ej: 200000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="submit"
                  disabled={savingBudget}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    cursor: savingBudget ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  {savingBudget ? 'Guardando...' : 'Guardar Presupuesto'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registrar Nueva Transacción */}
      {showTxForm && (
        <div style={overlayStyle} onClick={() => setShowTxForm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', fontWeight: '700', fontSize: 'var(--font-size-lg)' }}>
              Registrar Nuevo Gasto
            </h2>
            {txFormError && (
              <div
                style={{
                  color: 'var(--color-danger)',
                  background: 'var(--color-danger-light)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {txFormError}
              </div>
            )}
            <form onSubmit={handleTxSubmit}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="tx-amount">
                  Monto ($)
                </label>
                <input
                  id="tx-amount"
                  style={inputStyle}
                  type="number"
                  min="1"
                  step="any"
                  placeholder="50000"
                  value={txFormData.amount}
                  onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                  required
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="tx-category">
                  Categoría
                </label>
                <select
                  id="tx-category"
                  style={inputStyle}
                  value={txFormData.category}
                  onChange={(e) => setTxFormData({ ...txFormData, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="tx-description">
                  Descripción (opcional)
                </label>
                <input
                  id="tx-description"
                  style={inputStyle}
                  type="text"
                  placeholder="Almuerzo en restaurante"
                  value={txFormData.description}
                  onChange={(e) => setTxFormData({ ...txFormData, description: e.target.value })}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="tx-date">
                  Fecha
                </label>
                <input
                  id="tx-date"
                  style={inputStyle}
                  type="date"
                  value={txFormData.date}
                  onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    cursor: txSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  {txSubmitting ? 'Guardando...' : 'Registrar Gasto'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTxForm(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="container">
        {/* Barra superior del Resumen con botón de Presupuesto */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-md)',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
          }}
        >
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--color-text-primary)' }}>
              Resumen Financiero
            </h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Período actual: {currentMonth}
            </p>
          </div>
          <Button variant="secondary" onClick={handleOpenBudgetModal}>
            ✏️ {monthlyBudget > 0 ? 'Modificar Presupuesto' : 'Definir Presupuesto Mensual'}
          </Button>
        </div>

        {/* Métricas / Resumen Financiero con 4 tarjetas conectadas */}
        <section style={metricsGridStyle}>
          {/* Tarjeta 1: Presupuesto del Mes */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={metricLabelStyle}>Presupuesto del Mes</div>
              <button
                type="button"
                onClick={handleOpenBudgetModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0',
                }}
              >
                {monthlyBudget > 0 ? 'Modificar' : 'Definir'}
              </button>
            </div>
            <div style={{ ...metricValueStyle, color: 'var(--color-primary)' }}>
              {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : '$0.00'}
            </div>
            <div style={metricSubtitleStyle}>
              {monthlyBudget > 0 ? 'Límite mensual asignado' : 'Sin presupuesto definido'}
            </div>
          </Card>

          {/* Tarjeta 2: Gastos del Mes */}
          <Card>
            <div style={metricLabelStyle}>Gastos del Mes</div>
            <div style={{ ...metricValueStyle, color: 'var(--color-danger)' }}>
              {totalExpensesMonth > 0 ? `-${formatCurrency(totalExpensesMonth)}` : '$0.00'}
            </div>
            <div style={metricSubtitleStyle}>
              {expensesCount} {expensesCount === 1 ? 'movimiento' : 'movimientos'} este período
            </div>
          </Card>

          {/* Tarjeta 3: Presupuesto Restante */}
          <Card>
            <div style={metricLabelStyle}>Presupuesto Restante</div>
            <div
              style={{
                ...metricValueStyle,
                color: remainingBudget < 0 ? 'var(--color-danger)' : 'var(--color-success)',
              }}
            >
              {monthlyBudget > 0
                ? (remainingBudget < 0 ? '-' : '') + formatCurrency(remainingBudget)
                : '$0.00'}
            </div>
            <div style={metricSubtitleStyle}>
              {monthlyBudget > 0
                ? remainingBudget < 0
                  ? `⚠️ Excedido por ${formatCurrency(Math.abs(remainingBudget))}`
                  : `${usagePercent}% consumido (${100 - usagePercent}% disponible)`
                : 'Sin presupuesto activo'}
            </div>
          </Card>

          {/* Tarjeta 4: Balance Total */}
          <Card>
            <div style={metricLabelStyle}>Balance Total</div>
            <div
              style={{
                ...metricValueStyle,
                color: totalBalance < 0 ? 'var(--color-danger)' : 'var(--color-text-primary)',
              }}
            >
              {(totalBalance < 0 ? '-' : '') + formatCurrency(totalBalance)}
            </div>
            <div style={metricSubtitleStyle}>
              {monthlyBudget > 0 ? 'Saldo neto disponible' : 'Disponible en tus cuentas'}
            </div>
          </Card>
        </section>

        {/* Sección de Transacciones */}
        <section>
          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
            onNewTransaction={handleNewTransaction}
          />
        </section>
      </main>
    </div>
  );
}
