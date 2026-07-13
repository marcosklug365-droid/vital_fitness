import api from './Api.js'

export const getUsuariosService = async () => {
  const response = await api.get('/usuarios')
  return response.data
}

export const createUsuarioService = async (data) => {
  const response = await api.post('/usuarios', data)
  return response.data
}

export const updateUsuarioService = async (id, data) => {
  const response = await api.put(`/usuarios/${id}`, data)
  return response.data
}

export const toggleUsuarioActivoService = async (id) => {
  const response = await api.patch(`/usuarios/${id}/toggle`)
  return response.data
}
