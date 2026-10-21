import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

/**
 * Pantalla de inicio de sesión de Centavo.
 */
export function Login({ onLogin, isLoading, authError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err) {
      setLocalError(err.message || 'Error al iniciar sesión');
    }
  };

  const pageContainerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--color-background)',
  };

  const loginBoxStyle = {
    width: '100%',
    maxWidth: '420px',
  };

  const logoHeaderStyle = {
    textAlign: 'center',
    marginBottom: 'var(--space-xl)',
  };

  const brandTitleStyle = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: '800',
    color: 'var(--color-primary-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
  };

  const brandSubtitleStyle = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-xs)',
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
  };

  const errorMessageStyle = {
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    padding: '0.625rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    textAlign: 'center',
  };

  const displayError = localError || authError;

  return (
    <div style={pageContainerStyle}>
      <div style={loginBoxStyle}>
        <div style={logoHeaderStyle}>
          <div style={brandTitleStyle}>
            <span>🪙</span>
            <span>Centavo</span>
          </div>
          <p style={brandSubtitleStyle}>Control y salud financiera para tu día a día</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={formStyle}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700' }}>
              Iniciar Sesión
            </h2>

            {displayError && <div style={errorMessageStyle}>{displayError}</div>}

            <Input
              id="login-email"
              label="Correo Electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="login-password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            >
              {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
