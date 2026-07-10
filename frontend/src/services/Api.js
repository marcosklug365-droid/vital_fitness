import axios from 'axios'

// Creamos una instancia de axios con la URL base del backend 
// Así en todos lados solo escribimos la ruta: '/auth/login'
// en lugar de la URL completa: 'http://localhost:3000/api/auth/login'
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
})

// INTERCEPTOR DE PETICIONES
// Se ejecuta antes de que salga cualquier petición al backend
// Agrega automáticamente el token JWT al header Authorization
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// INTERCEPTOR DE RESPUESTAS
// Se ejecuta cuando el backend responde, antes de llegar a los componentes
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Si no hay respuesta del servidor (ej. backend caído)
    if (!error.response) {
      document.dispatchEvent(new CustomEvent('toast-error', { detail: 'Error de conexión con el servidor.' }))
      return Promise.reject(error)
    }

    const { status } = error.response

    // 401: No autorizado (token vencido o inválido)
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/' // Redirige al login
    }
    
    // 403: Prohibido (no tiene el rol necesario)
    if (status === 403) {
      document.dispatchEvent(new CustomEvent('toast-error', { detail: 'No tienes permisos para realizar esta acción.' }))
    }

    // 500: Error interno del servidor
    if (status === 500) {
      document.dispatchEvent(new CustomEvent('toast-error', { detail: 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.' }))
    }

    return Promise.reject(error)
  }
)

export default api