import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-base)',
        }}
      >
        Iniciando Centavo...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} isLoading={isLoading} authError={error} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
}

export default App;
