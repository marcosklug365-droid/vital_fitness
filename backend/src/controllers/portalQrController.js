import { prisma } from '../lib/prisma.js'
import { getIO } from '../lib/socket.js'

export const precheckQr = async (req, res) => {
  try {
    const { qrData } = req.body
    const clienteId = req.usuario.id

    // Validar formato del QR del gimnasio (ej: {"action":"check-in","branch":"central"})
    let datosQr
    try {
      datosQr = JSON.parse(qrData)
    } catch {
      return res.status(400).json({ error: 'Código QR no reconocido por el sistema.' })
    }

    if (datosQr.action !== 'check-in') {
      return res.status(400).json({ error: 'Este código QR no es válido para ingresos.' })
    }

    // Verificar si el cliente ya está adentro (Entrada sin Salida)
    const yaAdentro = await prisma.asistencia.findFirst({
      where: { clienteId, fechaSalida: null },
      orderBy: { fechaEntrada: 'desc' }
    })

    if (yaAdentro) {
      return res.json({ accion: 'salida', asistenciaId: yaAdentro.id })
    }

    // Si está afuera, verificar membresía
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        membresias: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    })

    const membresia = cliente?.membresias[0]
    
    if (!membresia) {
      return res.status(403).json({ error: 'No poseés ninguna membresía registrada.' })
    }

    const estaVencida = membresia.estado === 'vencida' || new Date(membresia.fechaVencimiento) < new Date()
    if (estaVencida) {
      return res.status(403).json({ error: 'Tu membresía se encuentra vencida. Dirigite a recepción.' })
    }

    return res.json({ accion: 'entrada' })
  } catch (error) {
    console.error('Error en precheck QR:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const confirmarQr = async (req, res) => {
  try {
    const { accion, asistenciaId } = req.body
    const clienteId = req.usuario.id
    
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })

    if (accion === 'salida' && asistenciaId) {
      // Registrar salida
      const asistencia = await prisma.asistencia.update({
        where: { id: asistenciaId },
        data: { fechaSalida: new Date() }
      })

      const ocupados = await prisma.asistencia.count({ where: { fechaSalida: null } })
      const io = getIO()
      io.emit('aforo-actualizado', {
        ocupados,
        evento: 'salida',
        cliente: `${cliente.nombre} ${cliente.apellido}`,
        hora: asistencia.fechaSalida
      })

      return res.json({ success: true, mensaje: 'Salida registrada. ¡Hasta luego!' })
    } 
    
    if (accion === 'entrada') {
      // Re-verificar estado para evitar concurrencia
      const yaAdentro = await prisma.asistencia.findFirst({
        where: { clienteId, fechaSalida: null }
      })
      if (yaAdentro) {
        return res.status(400).json({ error: 'Ya tenés una entrada registrada.' })
      }

      const asistencia = await prisma.asistencia.create({
        data: {
          clienteId,
          registradoPor: clienteId, // El mismo cliente se registra
          fechaEntrada: new Date()
        }
      })

      const ocupados = await prisma.asistencia.count({ where: { fechaSalida: null } })
      const io = getIO()
      io.emit('aforo-actualizado', {
        ocupados,
        evento: 'entrada',
        cliente: `${cliente.nombre} ${cliente.apellido}`,
        hora: asistencia.fechaEntrada
      })

      return res.json({ success: true, mensaje: 'Entrada registrada. ¡Que tengas un excelente entrenamiento!' })
    }

    return res.status(400).json({ error: 'Acción no válida.' })
  } catch (error) {
    console.error('Error en confirmar QR:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
