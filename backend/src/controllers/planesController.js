import { prisma } from '../lib/prisma.js'

// ─── OBTENER TODOS LOS PLANES ──────────────────────────
export const getPlanes = async (req, res) => {
  try {
    const planes = await prisma.plan.findMany({
      // _count nos dice cuántas membresías usan cada plan
      // sin necesidad de traer todas las membresías completas
      include: {
        _count: { select: { membresias: true } }
      },
      orderBy: { precio: 'asc' }
    })
    res.json(planes)
  } catch (error) {
    console.error('Error al obtener planes:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── CREAR UN PLAN ──────────────────────────────────
export const createPlan = async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracionDias, activo } = req.body

    if (!nombre || !precio || !duracionDias) {
      return res.status(400).json({
        error: 'Nombre, precio y duración en días son obligatorios'
      })
    }

    const plan = await prisma.plan.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        duracionDias: parseInt(duracionDias),
        activo: activo !== undefined ? activo : true
      }
    })

    res.status(201).json(plan)
  } catch (error) {
    console.error('Error al crear plan:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── EDITAR UN PLAN ──────────────────────────────────
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, precio, duracionDias, activo } = req.body

    const planExiste = await prisma.plan.findUnique({ where: { id: parseInt(id) } })
    if (!planExiste) {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }

    const plan = await prisma.plan.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        descripcion: descripcion || null,
        precio: precio !== undefined ? parseFloat(precio) : planExiste.precio,
        duracionDias: duracionDias !== undefined ? parseInt(duracionDias) : planExiste.duracionDias,
        activo: activo !== undefined ? activo : planExiste.activo
      }
    })

    res.json(plan)
  } catch (error) {
    console.error('Error al editar plan:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── ELIMINAR UN PLAN ──────────────────────────────────
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params

    // Verificamos si hay membresías usando este plan
    // Si las hay, no lo dejamos eliminar para no romper datos históricos
    const membresiasAsociadas = await prisma.membresia.count({
      where: { planId: parseInt(id) }
    })

    if (membresiasAsociadas > 0) {
      return res.status(400).json({
        error: `No se puede eliminar. Hay ${membresiasAsociadas} membresía(s) asociadas a este plan. Podés desactivarlo en su lugar.`
      })
    }

    await prisma.plan.delete({ where: { id: parseInt(id) } })
    res.json({ mensaje: 'Plan eliminado correctamente' })

  } catch (error) {
    console.error('Error al eliminar plan:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}