import api from './Api.js'

export const loginClienteService = async (credenciales) => {
  const response = await api.post('/auth/cliente/login', credenciales)
  return response.data
}

export const cambiarPasswordClienteService = async (datos) => {
  const response = await api.post('/auth/cliente/cambiar-password', datos)
  return response.data
}

export const getPerfilClienteService = async () => {
  const response = await api.get('/portal/perfil')
  return response.data
}

export const precheckQrService = async (qrData) => {
  const response = await api.post('/portal/qr/precheck', { qrData })
  return response.data
}

export const confirmarQrService = async (datos) => {
  const response = await api.post('/portal/qr/confirm', datos)
  return response.data
}
