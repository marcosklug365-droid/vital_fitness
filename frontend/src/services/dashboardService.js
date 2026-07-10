import api from './Api.js'

export const getDashboardService = async () => {
  const response = await api.get('/dashboard')
  return response.data
}