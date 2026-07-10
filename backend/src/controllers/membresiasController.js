import { prisma } from '../lib/prisma.js'

// Función auxiliar: calcula el estado de una membresía según su fecha de vencimiento
function calcularEstado(fechaVencimiento) {
  const hoy = new Date()
  const vencimiento = new Date(fechaVencimiento)
  const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

  if (diasRestantes < 0)  return { estado: 'vencida',    diasRestantes }
  if (diasRestantes <= 3) return { estado: 'por_vencer',  diasRestantes }
  return { estado: 'activa', diasRestantes }
}

// ─── INSCRIPCIÓN UNIFICADA (cliente + membresía + pago en una transacción) ──
// Acepta dos modos de operación:
//   Modo A (cliente nuevo):    { clienteDatos: {...}, planId, medioPago, monto, fechaInicio? }
//   Modo B (cliente existente): { clienteId, planId, medioPago, monto, fechaInicio? }
export const inscribirCliente = async (req, res) => {
  try {
    const { clienteId, clienteDatos, planId, medioPago, monto, fechaInicio } = req.body

    // Validar que se proporcione alguno de los dos modos
    if (!clienteId && !clienteDatos) {
      return res.status(400).json({ error: 'Debés proporcionar clienteId o los datos del nuevo cliente' })
    }

    // Validar campos del pago/membresía
    if (!planId || !medioPago || monto === undefined || monto === null) {
      return res.status(400).json({ error: 'Plan, medio de pago y monto son obligatorios' })
    }

    // Validar que el plan exista y esté activo
    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } })
    if (!plan || !plan.activo) {
      return res.status(404).json({ error: 'Plan no encontrado o inactivo' })
    }

    // Si se pasan datos de cliente nuevo, validar campos mínimos
    if (!clienteId && clienteDatos) {
      const { nombre, apellido, dni } = clienteDatos
      if (!nombre || !apellido || !dni) {
        return res.status(400).json({ error: 'Nombre, apellido y DNI son obligatorios para el nuevo cliente' })
      }
    }

    // Calcular fechas de membresía
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date()
    const vencimiento = new Date(inicio)
    vencimiento.setDate(inicio.getDate() + plan.duracionDias)

    // ── Transacción atómica ────────────────────────────────────────────────────
    // Si CUALQUIER paso falla, todos los cambios se revierten automáticamente.
    // Esto garantiza que nunca quede un cliente sin membresía ni un pago sin membresía.
    const resultado = await prisma.$transaction(async (tx) => {

      // PASO 1: Resolver el cliente
      let cliente

      if (clienteId) {
        // Modo B: usar cliente existente
        cliente = await tx.cliente.findUnique({ where: { id: parseInt(clienteId) } })
        if (!cliente) {
          throw new Error('CLIENTE_NO_ENCONTRADO')
        }
        if (!cliente.activo) {
          throw new Error('CLIENTE_INACTIVO')
        }
      } else {
        // Modo A: crear cliente nuevo
        // Verificar duplicado de DNI DENTRO de la transacción para evitar race conditions
        const clienteExistente = await tx.cliente.findUnique({ where: { dni: clienteDatos.dni } })
        if (clienteExistente) {
          // Lanzamos un error especial para devolver 409 Conflict con el id del cliente existente
          const error = new Error('DNI_DUPLICADO')
          error.clienteExistente = clienteExistente
          throw error
        }

        cliente = await tx.cliente.create({
          data: {
            nombre:               clienteDatos.nombre,
            apellido:             clienteDatos.apellido,
            dni:                  clienteDatos.dni,
            telefono:             clienteDatos.telefono || null,
            email:                clienteDatos.email    || null,
            fechaNacimiento:      clienteDatos.fechaNacimiento ? new Date(clienteDatos.fechaNacimiento) : null,
            direccion:            clienteDatos.direccion || null,
            contactoDeEmergencia: clienteDatos.contactoDeEmergencia || null,
          }
        })
      }

      // PASO 2: Marcar como 'vencidas' las membresías activas anteriores del cliente
      await tx.membresia.updateMany({
        where: { clienteId: cliente.id, estado: 'activa' },
        data:  { estado: 'vencida' }
      })

      // PASO 3: Crear la nueva membresía
      const membresia = await tx.membresia.create({
        data: {
          clienteId:        cliente.id,
          planId:           parseInt(planId),
          fechaInicio:      inicio,
          fechaVencimiento: vencimiento,
          estado:           'activa'
        },
        include: { plan: true }
      })

      // PASO 4: Crear el pago asociado a la membresía
      const pago = await tx.pago.create({
        data: {
          clienteId:   cliente.id,
          membresiaId: membresia.id,
          monto:       parseFloat(monto),
          medioPago,
          fechaPago:   inicio
        }
      })

      return { cliente, membresia, pago }
    })

    res.status(201).json(resultado)

  } catch (error) {
    // Manejo granular de errores de negocio
    if (error.message === 'DNI_DUPLICADO') {
      return res.status(409).json({
        error:             'Ya existe un cliente registrado con ese DNI',
        clienteExistente:  error.clienteExistente
      })
    }
    if (error.message === 'CLIENTE_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'El cliente especificado no existe' })
    }
    if (error.message === 'CLIENTE_INACTIVO') {
      return res.status(400).json({ error: 'El cliente está inactivo y no puede ser inscripto' })
    }

    console.error('Error al inscribir cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── OBTENER TODAS LAS MEMBRESÍAS ──────────────────────────
export const getMembresias = async (req, res) => {
  try {
    const membresias = await prisma.membresia.findMany({
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
        plan: true
      },
      orderBy: { fechaVencimiento: 'asc' }
    })

    // Le agregamos el estado calculado a cada una
    const resultado = membresias.map(m => ({
      ...m,
      ...calcularEstado(m.fechaVencimiento)
    }))

    res.json(resultado)
  } catch (error) {
    console.error('Error al obtener membresías:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── MEMBRESÍAS POR VENCER (vencidas + próximas a vencer) ──────
export const getMembresiasPorVencer = async (req, res) => {
  try {
    // Traemos solo las membresías activas (no las suspendidas manualmente)
    const membresias = await prisma.membresia.findMany({
      where: { estado: 'activa' },
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true, email: true } },
        plan: true
      }
    })

    // Calculamos estado real y filtramos solo las urgentes (vencidas o por vencer)
    const conEstado = membresias
      .map(m => ({ ...m, ...calcularEstado(m.fechaVencimiento) }))
      .filter(m => m.estado === 'vencida' || m.estado === 'por_vencer')
      .sort((a, b) => a.diasRestantes - b.diasRestantes) // las más urgentes primero

    res.json(conEstado)
  } catch (error) {
    console.error('Error al obtener membresías por vencer:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── ASIGNAR/RENOVAR MEMBRESÍA (crea membresía + pago juntos) ──────
export const renovarMembresia = async (req, res) => {
  try {
    const { clienteId, planId, fechaInicio, medioPago, monto } = req.body

    if (!clienteId || !planId || !medioPago || !monto) {
      return res.status(400).json({
        error: 'Cliente, plan, medio de pago y monto son obligatorios'
      })
    }

    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } })
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }

    const inicio = fechaInicio ? new Date(fechaInicio) : new Date()
    const vencimiento = new Date(inicio)
    vencimiento.setDate(inicio.getDate() + plan.duracionDias)

    // prisma.$transaction asegura que las dos operaciones (crear membresía
    // y crear pago) se hagan juntas. Si una falla, se revierte la otra.
    // Esto evita que quede una membresía sin su pago correspondiente.
    const resultado = await prisma.$transaction(async (tx) => {

      // Marcar como 'vencidas' las membresías activas anteriores del cliente
      await tx.membresia.updateMany({
        where: {
          clienteId: parseInt(clienteId),
          estado: 'activa'
        },
        data: {
          estado: 'vencida'
        }
      })

      const membresia = await tx.membresia.create({
        data: {
          clienteId: parseInt(clienteId),
          planId: parseInt(planId),
          fechaInicio: inicio,
          fechaVencimiento: vencimiento,
          estado: 'activa'
        }
      })

      const pago = await tx.pago.create({
        data: {
          clienteId: parseInt(clienteId),
          membresiaId: membresia.id,
          monto: parseFloat(monto),
          medioPago,
          fechaPago: inicio
        }
      })

      return { membresia, pago }
    })

    res.status(201).json(resultado)

  } catch (error) {
    console.error('Error al renovar membresía:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── SUSPENDER UNA MEMBRESÍA ──────────────────────────────
export const suspenderMembresia = async (req, res) => {
  try {
    const { id } = req.params

    const membresia = await prisma.membresia.update({
      where: { id: parseInt(id) },
      data: { estado: 'suspendida' }
    })

    res.json(membresia)
  } catch (error) {
    console.error('Error al suspender membresía:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}