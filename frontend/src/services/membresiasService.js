import api from './api.js'

export const getMembresiasPorVencerService = async () => {
  const response = await api.get('/membresias/por-vencer')
  return response.data
}

export const renovarMembresiaService = async (datos) => {
  const response = await api.post('/membresias/renovar', datos)
  return response.data
}