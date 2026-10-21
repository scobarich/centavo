import React from 'react';
import { Button } from './Button';

/**
 * Componente EmptyState para indicar la ausencia de registros.
 */
export function EmptyState({
  title = 'No hay transacciones registradas',
  description = 'Comienza a tomar el control de tus finanzas personales agregando tu primer ingreso o gasto.',
  actionLabel = 'Registrar transacción',
  onAction,
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl) var(--space-md)',
    textAlign: 'center',
  };

  const iconContainerStyle = {
    width: '72px',
    height: '72px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    marginBottom: 'var(--space-md)',
  };

  const titleStyle = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-xs)',
  };

  const descriptionStyle = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    maxWidth: '420px',
    marginBottom: 'var(--space-lg)',
  };

  return (
    <div style={containerStyle} className="empty-state">
      <div style={iconContainerStyle}>🪙</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descriptionStyle}>{description}</p>
      {onAction && (
        <Button variant="primary" onClick={onAction}>
          + {actionLabel}
        </Button>
      )}
    </div>
  );
}
