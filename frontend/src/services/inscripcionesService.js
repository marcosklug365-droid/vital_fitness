import api from './Api.js'

export const createInscripcionService = async (datos) => {
  const response = await api.post('/inscripciones', datos)
  return response.data
}

export const cancelarInscripcionService = async (id) => {
  const response = await api.put(`/inscripciones/${id}/cancelar`)
  return response.data
}