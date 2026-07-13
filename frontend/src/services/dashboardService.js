import api from './Api.js'

export const getDashboardService = async () => {
  const response = await api.get('/dashboard')
  return response.data
}

export const getMetricasGraficosService = async (rango = '6meses') => {
  const response = await api.get(`/dashboard/metricas?rango=${rango}`)
  return response.data
}