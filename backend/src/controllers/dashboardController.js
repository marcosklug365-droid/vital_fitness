import { prisma } from '../lib/prisma.js'

// Mapea el número de día de JavaScript (0=domingo) a nuestro enum en español
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

export const getDashboard = async (req, res) => {
  try {
    const hoy = new Date()
    const diaActual = DIAS_SEMANA[hoy.getDay()]

    const inicioMes = new Date(hoy); inicioMes.setMonth(hoy.getMonth() - 1)
    const inicioMesAnterior = new Date(hoy); inicioMesAnterior.setMonth(hoy.getMonth() - 2)

    // Promise.all para no esperar cada consulta una por una
    const [
      clientesActivos,
      membresiasActivas,
      ingresosMes,
      ingresosMesAnterior,
      personasDentro,
      clasesHoy
    ] = await Promise.all([

      // Total de clientes activos (no dados de baja)
      prisma.cliente.count({ where: { activo: true } }),

      // Todas las membresías activas, para calcular morosos y por vencer
      prisma.membresia.findMany({
        where: { estado: 'activa' },
        include: { cliente: { select: { nombre: true, apellido: true } } }
      }),

      // Ingresos del mes
      prisma.pago.aggregate({ where: { fechaPago: { gte: inicioMes } }, _sum: { monto: true } }),

      // Ingresos del mes anterior (para calcular variación)
      prisma.pago.aggregate({
        where: { fechaPago: { gte: inicioMesAnterior, lt: inicioMes } },
        _sum: { monto: true }
      }),

      // Cuántas personas hay ahora mismo en el gimnasio
      prisma.asistencia.count({ where: { fechaSalida: null } }),

      // Clases programadas para el día de hoy, con su cantidad de inscriptos
      prisma.clase.findMany({
        where: { diaSemana: diaActual, activa: true },
        include: {
          instructor: { select: { nombre: true, apellido: true } },
          _count: { select: { inscripciones: { where: { estado: 'confirmada' } } } }
        },
        orderBy: { horaInicio: 'asc' }
      })
    ])

    // Calculamos estado de cada membresía para sacar morosos y por vencer
    let clientesMorosos = 0
    let membresiasPorVencer = 0
    const alertas = []

    membresiasActivas.forEach((m) => {
      const diasRestantes = Math.ceil((new Date(m.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24))

      if (diasRestantes < 0) {
        clientesMorosos++
        alertas.push({
          tipo: 'vencida',
          texto: `${m.cliente.nombre} ${m.cliente.apellido} — Membresía vencida hace ${Math.abs(diasRestantes)} días`
        })
      } else if (diasRestantes <= 3) {
        membresiasPorVencer++
        alertas.push({
          tipo: 'por_vencer',
          texto: `${m.cliente.nombre} ${m.cliente.apellido} — Vence en ${diasRestantes} día(s)`
        })
      }
    })

    const totalMes = Number(ingresosMes._sum.monto || 0)
    const totalMesAnterior = Number(ingresosMesAnterior._sum.monto || 0)
    const variacionIngresos = totalMesAnterior > 0
      ? Math.round(((totalMes - totalMesAnterior) / totalMesAnterior) * 100)
      : null

    res.json({
      clientesActivos,
      clientesMorosos,
      membresiasPorVencer,
      ingresosMes: totalMes,
      variacionIngresos,
      personasDentro,
      capacidadMaxima: parseInt(process.env.GYM_CAPACIDAD_MAXIMA) || 12,
      clasesHoy: clasesHoy.map(c => ({
        id: c.id,
        nombre: c.nombre,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        instructor: `${c.instructor.nombre} ${c.instructor.apellido}`,
        inscriptos: c._count.inscripciones,
        capacidadMaxima: c.capacidadMaxima
      })),
      // Ordenamos las alertas: primero las vencidas, después por vencer, máximo 6
      alertas: alertas
        .sort((a, b) => (a.tipo === 'vencida' ? -1 : 1))
        .slice(0, 6)
    })

  } catch (error) {
    console.error('Error al obtener dashboard:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}