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
// Se ejecuta cuando llega la respuesta del backend
// Si el backend responde 401 (no autorizado) redirige al login
// Esto maneja el caso en el que el token expiró
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('usuario')
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

export default api