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