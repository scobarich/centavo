const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';

/**
 * Cliente HTTP base para la capa de servicios de Centavo.
 * Maneja encabezados de autenticación y serialización de respuestas.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('centavo_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Error en la petición: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Si la API remota no está levantada en entorno local, propagamos el error controlado
    throw error;
  }
}
