import { prisma } from '../lib/prisma.js'

// ─── INSCRIBIR UN CLIENTE A UNA CLASE ──────────────
export const createInscripcion = async (req, res) => {
    try {
        const { claseId, clienteId, fecha } = req.body

        if (!claseId || !clienteId) {
            return res.status(400).json({ error: 'Clase y cliente son obligatorios' })
        }

        const clase = await prisma.clase.findUnique({
            where: { id: parseInt(claseId) },
            include: { _count: { select: { inscripciones: { where: { estado: 'confirmada' } } } } }
        })

        if (!clase) {
            return res.status(404).json({ error: 'Clase no encontrada' })
        }

        // Verificamos que haya cupo disponible
        if (clase._count.inscripciones >= clase.capacidadMaxima) {
            return res.status(400).json({ error: 'La clase ya alcanzó su capacidad máxima' })
        }

        // Verificamos que el cliente no esté ya inscripto en esta misma clase
        const yaInscripto = await prisma.inscripcion.findFirst({
            where: {
                claseId: parseInt(claseId),
                clienteId: parseInt(clienteId),
                estado: 'confirmada'
            }
        })

        if (yaInscripto) {
            return res.status(400).json({ error: 'El cliente ya está inscripto en esta clase' })
        }

        const inscripcion = await prisma.inscripcion.create({
            data: {
                claseId: parseInt(claseId),
                clienteId: parseInt(clienteId),
                fecha: fecha ? new Date(fecha) : new Date(),
                estado: 'confirmada'
            },
            include: {
                cliente: { select: { nombre: true, apellido: true } }
            }
        })

        res.status(201).json(inscripcion)

    } catch (error) {
        console.error('Error al crear inscripción:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── CANCELAR UNA INSCRIPCIÓN ──────────────
export const cancelarInscripcion = async (req, res) => {
    try {
        const { id } = req.params

        const inscripcion = await prisma.inscripcion.findUnique({ where: { id: parseInt(id) } })
        if (!inscripcion) {
            return res.status(404).json({ error: 'Inscripción no encontrada' })
        }

        await prisma.inscripcion.update({
            where: { id: parseInt(id) },
            data: { estado: 'cancelada' }
        })

        res.json({ mensaje: 'Inscripción cancelada correctamente' })

    } catch (error) {
        console.error('Error al cancelar inscripción:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}