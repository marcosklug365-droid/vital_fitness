import api from './api.js'

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