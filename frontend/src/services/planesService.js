import api from './api.js'

export const getPlanesService = async () => {
  const response = await api.get('/planes')
  return response.data
}

export const createPlanService = async (datos) => {
  const response = await api.post('/planes', datos)
  return response.data
}

export const updatePlanService = async (id, datos) => {
  const response = await api.put(`/planes/${id}`, datos)
  return response.data
}

export const deletePlanService = async (id) => {
  const response = await api.delete(`/planes/${id}`)
  return response.data
}