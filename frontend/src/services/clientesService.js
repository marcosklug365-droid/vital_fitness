import api from './Api.js'

export const getClientesService = async (filtro = '', busqueda = '') => {
  const response = await api.get('/clientes', {
    params: { filtro, busqueda }
  })
  return response.data
}

export const getClienteByIdService = async (id) => {
  const response = await api.get(`/clientes/${id}`)
  return response.data
}

export const createClienteService = async (datos) => {
  const response = await api.post('/clientes', datos)
  return response.data
}

export const updateClienteService = async (id, datos) => {
  const response = await api.put(`/clientes/${id}`, datos)
  return response.data
}

export const deleteClienteService = async (id) => {
  const response = await api.delete(`/clientes/${id}`)
  return response.data
}

/**
 * Busca un cliente por DNI de forma exacta.
 * Retorna el cliente si existe, o null si no hay coincidencia.
 * Usado por el Wizard de Inscripción para detectar clientes duplicados.
 */
export const buscarClientePorDniService = async (dni) => {
  const response = await api.get('/clientes', {
    params: { busqueda: dni, exacto: 'true' }
  })
  // El backend devuelve un array; tomamos el primer elemento o null
  return response.data.length > 0 ? response.data[0] : null
}