import React from 'react';
import { Button } from '../common/Button';

/**
 * Barra de navegación superior para el Dashboard de Centavo.
 */
export function Navbar({ user, onLogout }) {
  const headerStyle = {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const navContainerStyle = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0.875rem var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: 'var(--font-size-lg)',
    fontWeight: '700',
    color: 'var(--color-primary-dark)',
  };

  const userSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
  };

  const userGreetingStyle = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  };

  const userHighlightStyle = {
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  };

  return (
    <header style={headerStyle}>
      <div style={navContainerStyle}>
        <div style={brandStyle}>
          <span style={{ fontSize: '1.4rem' }}>🪙</span>
          <span>Centavo</span>
        </div>

        <div style={userSectionStyle}>
          {user && (
            <span style={userGreetingStyle}>
              Hola, <span style={userHighlightStyle}>{user.name || user.email}</span>
            </span>
          )}
          <Button variant="secondary" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
