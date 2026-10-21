import React from 'react';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';

/**
 * Componente que renderiza el listado de transacciones o su estado vacío.
 */
export function TransactionList({ transactions = [], isLoading = false, onNewTransaction }) {
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-md)',
  };

  const titleStyle = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  };

  const badgeStyle = {
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-surface-hover)',
    color: 'var(--color-text-secondary)',
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--radius-full)',
    marginLeft: 'var(--space-sm)',
    fontWeight: '500',
  };

  const loadingStyle = {
    padding: 'var(--space-2xl)',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <div>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={titleStyle}>Historial de Movimientos</h2>
          <span style={badgeStyle}>{transactions.length} transacciones</span>
        </div>
        <Button variant="primary" onClick={onNewTransaction}>
          + Nueva Transacción
        </Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={loadingStyle}>Cargando transacciones...</div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="Sin movimientos registrados"
            description="Aún no has registrado ningún gasto o ingreso en este período. Registra tus movimientos para activar el seguimiento de tus presupuestos."
            actionLabel="Registrar mi primera transacción"
            onAction={onNewTransaction}
          />
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {transactions.map((tx) => (
              <li
                key={tx.id}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{tx.title || tx.description}</strong>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {tx.category ? (tx.category.charAt(0).toUpperCase() + tx.category.slice(1)) : ''} • {tx.date}
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: '700',
                    color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
