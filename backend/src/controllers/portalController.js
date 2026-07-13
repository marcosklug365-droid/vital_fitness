import { prisma } from '../lib/prisma.js'

export const getPerfilCliente = async (req, res) => {
  try {
    const clienteId = req.usuario.id // ID from the JWT token

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        membresias: {
          orderBy: { id: 'desc' },
          include: {
            plan: true
          }
        },
        asistencias: {
          orderBy: { fechaEntrada: 'desc' }
        },
        pagos: {
          orderBy: { fechaPago: 'desc' },
          take: 1
        }
      }
    })

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })

    const membresiaActiva = cliente.membresias.find(m => m.estado === 'activa')
    const ultimaAsistencia = cliente.asistencias[0] || null
    const ultimoPago = cliente.pagos[0] || null

    // Calcular asistencias del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const asistenciasMes = cliente.asistencias.filter(a => new Date(a.fechaEntrada) >= firstDayOfMonth)

    res.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni: cliente.dni,
        email: cliente.email
      },
      membresiaActiva,
      ultimaAsistencia,
      ultimoPago,
      asistenciasDelMes: asistenciasMes.length,
      historialMembresias: cliente.membresias,
      historialAsistencias: cliente.asistencias,
      historialPagos: cliente.pagos
    })

  } catch (error) {
    console.error('Error al obtener perfil del cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
