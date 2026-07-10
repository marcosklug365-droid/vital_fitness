import api from './Api.js'

export const getMembresiasPorVencerService = async () => {
  const response = await api.get('/membresias/por-vencer')
  return response.data
}

export const renovarMembresiaService = async (datos) => {
  const response = await api.post('/membresias/renovar', datos)
  return response.data
}

/**
 * Inscripción unificada: crea cliente (si es nuevo) + membresía + pago en una sola transacción.
 *
 * Modo A — Cliente nuevo:
 *   { clienteDatos: { nombre, apellido, dni, ... }, planId, medioPago, monto, fechaInicio? }
 *
 * Modo B — Cliente existente:
 *   { clienteId: number, planId, medioPago, monto, fechaInicio? }
 *
 * En caso de DNI duplicado, el backend responde 409 con { error, clienteExistente }.
 */
export const inscribirClienteService = async (datos) => {
  const response = await api.post('/membresias/inscribir', datos)
  return response.data
}