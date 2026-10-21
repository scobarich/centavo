import React from 'react';

/**
 * Componente Contenedor Tarjeta reutilizable del sistema de diseño.
 */
export function Card({ children, className = '', style = {}, onClick }) {
  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    padding: 'var(--space-lg)',
    ...style,
  };

  return (
    <div style={cardStyle} className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
