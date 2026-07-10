import api from './Api.js'

export const getPagosService = async (filtros = {}) => {
  const response = await api.get('/pagos', { params: filtros })
  return response.data
}

export const getResumenPagosService = async () => {
  const response = await api.get('/pagos/resumen')
  return response.data
}

export const createPagoService = async (datos) => {
  const response = await api.post('/pagos', datos)
  return response.data
}
