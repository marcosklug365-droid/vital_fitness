import api from './Api.js'

export const getAforoService = async () => {
  const response = await api.get('/asistencias/aforo')
  return response.data
}

export const registrarEntradaService = async (clienteId) => {
  const response = await api.post('/asistencias/entrada', { clienteId })
  return response.data
}

export const registrarSalidaService = async (asistenciaId) => {
  const response = await api.put(`/asistencias/salida/${asistenciaId}`)
  return response.data
}

export const getHistorialHoyService = async () => {
  const response = await api.get('/asistencias/historial-hoy')
  return response.data
}