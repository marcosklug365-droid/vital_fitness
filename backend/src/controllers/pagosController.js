import { prisma } from '../lib/prisma.js'

// Función auxiliar: calcula el rango de fechas según el período solicitado
function obtenerRangoFechas(periodo) {
  const hoy = new Date()
  const inicio = new Date(hoy)

  if (periodo === 'hoy') {
    inicio.setHours(0, 0, 0, 0)
  } else if (periodo === 'semana') {
    inicio.setDate(hoy.getDate() - 7)
  } else if (periodo === 'mes') {
    inicio.setMonth(hoy.getMonth() - 1)
  } else if (periodo === 'anio') {
    inicio.setFullYear(hoy.getFullYear() - 1)
  } else {
    return null // sin filtro de fecha
  }
  return inicio
}

// ─── OBTENER TODOS LOS PAGOS (con filtros) ──────────────────────
export const getPagos = async (req, res) => {
  try {
    const { periodo, medioPago, busqueda } = req.query

    let where = {}

    // Filtro por período
    const fechaDesde = obtenerRangoFechas(periodo)
    if (fechaDesde) {
      where.fechaPago = { gte: fechaDesde }
    }

    // Filtro por medio de pago
    if (medioPago && medioPago !== 'todos') {
      where.medioPago = medioPago
    }

    // Filtro por búsqueda de cliente (nombre o apellido)
    if (busqueda) {
      where.cliente = {
        OR: [
          { nombre:   { contains: busqueda, mode: 'insensitive' } },
          { apellido: { contains: busqueda, mode: 'insensitive' } },
        ]
      }
    }

    const pagos = await prisma.pago.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
        membresia: { include: { plan: { select: { nombre: true } } } }
      },
      orderBy: [{ fechaPago: 'desc' }, { id: 'desc' }]
    })

    res.json(pagos)

  } catch (error) {
    console.error('Error al obtener pagos:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── RESUMEN DE INGRESOS ──────────────────────
export const getResumenPagos = async (req, res) => {
  try {
    const hoy = new Date()

    const inicioHoy = new Date(hoy); inicioHoy.setHours(0, 0, 0, 0)
    const inicioSemana = new Date(hoy); inicioSemana.setDate(hoy.getDate() - 7)
    const inicioMes = new Date(hoy); inicioMes.setMonth(hoy.getMonth() - 1)
    const inicioMesAnterior = new Date(hoy); inicioMesAnterior.setMonth(hoy.getMonth() - 2)

    // Promise.all ejecuta varias consultas en paralelo en lugar de una por una
    // Esto hace que la respuesta sea mucho más rápida
    const [
      pagosHoy,
      pagosSemana,
      pagosMes,
      pagosMesAnterior,
      pagosPorMedio
    ] = await Promise.all([
      prisma.pago.aggregate({ where: { fechaPago: { gte: inicioHoy } }, _sum: { monto: true }, _count: true }),
      prisma.pago.aggregate({ where: { fechaPago: { gte: inicioSemana } }, _sum: { monto: true } }),
      prisma.pago.aggregate({ where: { fechaPago: { gte: inicioMes } }, _sum: { monto: true } }),
      prisma.pago.aggregate({ where: { fechaPago: { gte: inicioMesAnterior, lt: inicioMes } }, _sum: { monto: true } }),
      prisma.pago.groupBy({
        by: ['medioPago'],
        where: { fechaPago: { gte: inicioMes } },
        _sum: { monto: true }
      })
    ])

    // Calculamos clientes morosos: membresías activas ya vencidas
    const membresiasVencidas = await prisma.membresia.findMany({
      where: { estado: 'activa', fechaVencimiento: { lt: hoy } },
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true } },
        plan: { select: { precio: true } }
      },
      orderBy: { fechaVencimiento: 'asc' }
    })

    const totalMes = Number(pagosMes._sum.monto || 0)
    const totalMesAnterior = Number(pagosMesAnterior._sum.monto || 0)
    const variacionMes = totalMesAnterior > 0
      ? Math.round(((totalMes - totalMesAnterior) / totalMesAnterior) * 100)
      : null

    res.json({
      hoy: {
        total: Number(pagosHoy._sum.monto || 0),
        cantidadPagos: pagosHoy._count
      },
      semana: { total: Number(pagosSemana._sum.monto || 0) },
      mes: { total: totalMes, variacionPorcentual: variacionMes },
      porMedioPago: pagosPorMedio.map(p => ({
        medioPago: p.medioPago,
        total: Number(p._sum.monto || 0)
      })),
      morosos: {
        cantidad: membresiasVencidas.length,
        totalAdeudado: membresiasVencidas.reduce((acc, m) => acc + Number(m.plan.precio), 0),
        clientes: membresiasVencidas.map(m => ({
          cliente: m.cliente,
          diasVencido: Math.ceil((hoy - new Date(m.fechaVencimiento)) / (1000 * 60 * 60 * 24)),
          monto: m.plan.precio
        }))
      }
    })

  } catch (error) {
    console.error('Error al obtener resumen de pagos:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── PAGOS DE UN CLIENTE ESPECÍFICO ──────────────────────
export const getPagosPorCliente = async (req, res) => {
  try {
    const { id } = req.params

    const pagos = await prisma.pago.findMany({
      where: { clienteId: parseInt(id) },
      include: { membresia: { include: { plan: { select: { nombre: true } } } } },
      orderBy: { fechaPago: 'desc' }
    })

    res.json(pagos)

  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── REGISTRAR UN PAGO (independiente, sobre una membresía existente) ──────
export const createPago = async (req, res) => {
  try {
    const { clienteId, monto, medioPago, fechaPago, observaciones } = req.body

    if (!clienteId || !monto || !medioPago) {
      return res.status(400).json({
        error: 'Cliente, monto y medio de pago son obligatorios'
      })
    }
    
    // Validate medioPago explicitly against the DB enum types to avoid 500 error if someone sends invalid input like 'mercado_pago'
    const validMediosPago = ['efectivo', 'transferencia', 'tarjeta_de_debito']
    if (!validMediosPago.includes(medioPago)) {
      return res.status(400).json({
        error: 'Medio de pago no válido'
      })
    }

    // Buscamos la membresía más reciente del cliente para asociar el pago
    const membresia = await prisma.membresia.findFirst({
      where: { clienteId: parseInt(clienteId) },
      orderBy: { createdAt: 'desc' }
    })

    if (!membresia) {
      return res.status(400).json({
        error: 'Este cliente no tiene una membresía asignada. Asignale un plan primero desde la sección de Membresías.'
      })
    }

    // Si fechaPago llega como "YYYY-MM-DD" (sin hora ni zona horaria), parsearlo
    // como hora local añadiendo T00:00:00 sin el sufijo Z. De lo contrario,
    // new Date("YYYY-MM-DD") lo interpreta como UTC midnight, lo que en
    // Argentina (UTC-3) produce un desfase de 3 horas y hace que la fecha
    // quede fuera del rango "hoy" calculado en hora local por getResumenPagos.
    let fechaPagoDate
    if (fechaPago) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
        // Solo fecha, sin hora: interpretar en hora local
        fechaPagoDate = new Date(`${fechaPago}T00:00:00`)
      } else {
        fechaPagoDate = new Date(fechaPago)
      }
    } else {
      fechaPagoDate = new Date()
    }

    const pago = await prisma.pago.create({
      data: {
        clienteId: parseInt(clienteId),
        membresiaId: membresia.id,
        monto: parseFloat(monto),
        medioPago,
        fechaPago: fechaPagoDate,
        observaciones: observaciones || null
      },
      include: {
        cliente: { select: { nombre: true, apellido: true } }
      }
    })

    res.status(201).json(pago)

  } catch (error) {
    console.error('Error al registrar pago:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
