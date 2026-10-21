import { apiRequest } from './api';

/**
 * Servicio para comunicación con auth-service.
 */
export const authService = {
  /**
   * Inicia sesión con email y contraseña.
   * Soporta fallback para desarrollo si el microservicio aún no está en ejecución.
   */
  async login(email, password) {
    try {
      return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      // Fallback simulado para desarrollo local si el backend no responde
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // Validación básica simulada
        if (!email || !password) {
          throw new Error('Por favor completa todos los campos.');
        }
        return {
          token: 'demo-centavo-token-' + Date.now(),
          user: {
            id: 'usr_demo_1',
            email,
            name: email.split('@')[0],
          },
        };
      }
      throw err;
    }
  },

  /**
   * Cierra sesión eliminando credenciales persistidas.
   */
  logout() {
    localStorage.removeItem('centavo_token');
    localStorage.removeItem('centavo_user');
  },

  /**
   * Obtiene la sesión actual almacenada.
   */
  getStoredSession() {
    const token = localStorage.getItem('centavo_token');
    const userJson = localStorage.getItem('centavo_user');
    if (!token || !userJson) return null;

    try {
      return { token, user: JSON.parse(userJson) };
    } catch {
      return null;
    }
  },

  /**
   * Guarda los datos de sesión en almacenamiento local.
   */
  saveSession(token, user) {
    localStorage.setItem('centavo_token', token);
    localStorage.setItem('centavo_user', JSON.stringify(user));
  },
};
