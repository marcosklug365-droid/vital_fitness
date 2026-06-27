import api from './Api'

// Función para hacer login
// Recibe email y password, llama al backend y devuelve token + usuario
export const loginService = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
}

// Función para obtener el perfil del usuario logueado
export const getPerfilService = async () => {
    const response = await api.get('/auth/perfil')
    return response.data
}