import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

/**
 * Hook personalizado para manejar la autenticación y la sesión del usuario.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión persistida al iniciar
  useEffect(() => {
    const session = authService.getStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      authService.saveSession(data.token, data.user);
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    error,
    login,
    logout,
  };
}
