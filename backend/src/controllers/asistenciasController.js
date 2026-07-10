import { prisma } from '../lib/prisma.js'
import { getIO } from '../lib/socket.js'

// ─── OBTENER EL AFORO ACTUAL ──────────────────────────
export const getAforo = async (req, res) => {
    try {
        const capacidadMaxima = parseInt(process.env.GYM_CAPACIDAD_MAXIMA) || 12

        // Los clientes "dentro" son los que tienen una asistencia
        // con fechaEntrada pero SIN fechaSalida (fechaSalida es null)
        const clientesDentro = await prisma.asistencia.findMany({
            where: { fechaSalida: null },
            include: {
                cliente: { select: { id: true, nombre: true, apellido: true } }
            },
            orderBy: { fechaEntrada: 'asc' }
        })

        res.json({
            ocupados: clientesDentro.length,
            capacidadMaxima,
            clientesDentro
        })

    } catch (error) {
        console.error('Error al obtener aforo:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── REGISTRAR ENTRADA ──────────────────────────────
export const registrarEntrada = async (req, res) => {
    try {
        const { clienteId } = req.body

        if (!clienteId) {
            return res.status(400).json({ error: 'clienteId es obligatorio' })
        }

        const cliente = await prisma.cliente.findUnique({
            where: { id: parseInt(clienteId) },
            include: {
                membresias: { orderBy: { createdAt: 'desc' }, take: 1, include: { plan: true } }
            }
        })

        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }

        // Evitamos que un cliente quede "duplicado" adentro
        // si ya tiene una entrada sin salida registrada
        const yaAdentro = await prisma.asistencia.findFirst({
            where: { clienteId: parseInt(clienteId), fechaSalida: null }
        })

        if (yaAdentro) {
            return res.status(400).json({
                error: `${cliente.nombre} ya tiene una entrada registrada sin salida. Registrá su salida primero.`
            })
        }

        const asistencia = await prisma.asistencia.create({
            data: {
                clienteId: parseInt(clienteId),
                registradoPor: req.usuario.id, // viene del middleware verificarToken
                fechaEntrada: new Date()
            }
        })

        // Calculamos el nuevo aforo después de esta entrada
        const ocupados = await prisma.asistencia.count({ where: { fechaSalida: null } })

        // Acá está la magia de Socket.io: emitimos un evento
        // a TODOS los navegadores conectados, sin que nadie lo pida
        const io = getIO()
        io.emit('aforo-actualizado', {
            ocupados,
            evento: 'entrada',
            cliente: `${cliente.nombre} ${cliente.apellido}`,
            hora: asistencia.fechaEntrada
        })

        // Calculamos si la membresía está vencida, para avisarle al frontend
        const membresia = cliente.membresias[0]
        let membresiaVencida = false
        if (membresia) {
            membresiaVencida = new Date(membresia.fechaVencimiento) < new Date()
        }

        res.status(201).json({ asistencia, ocupados, membresiaVencida })

    } catch (error) {
        console.error('Error al registrar entrada:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── REGISTRAR SALIDA ──────────────────────────────
export const registrarSalida = async (req, res) => {
    try {
        const { id } = req.params

        const asistencia = await prisma.asistencia.findUnique({ where: { id: parseInt(id) } })

        if (!asistencia) {
            return res.status(404).json({ error: 'Registro de asistencia no encontrado' })
        }

        if (asistencia.fechaSalida) {
            return res.status(400).json({ error: 'Esta asistencia ya tiene una salida registrada' })
        }

        const actualizada = await prisma.asistencia.update({
            where: { id: parseInt(id) },
            data: { fechaSalida: new Date() }
        })

        const ocupados = await prisma.asistencia.count({ where: { fechaSalida: null } })

        const io = getIO()
        io.emit('aforo-actualizado', { ocupados, evento: 'salida' })

        res.json({ asistencia: actualizada, ocupados })

    } catch (error) {
        console.error('Error al registrar salida:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── HISTORIAL DE HOY (para la lista de movimientos) ──────────────────────────────
export const getHistorialHoy = async (req, res) => {
    try {
        const inicioDia = new Date()
        inicioDia.setHours(0, 0, 0, 0)

        const asistencias = await prisma.asistencia.findMany({
            where: { fechaEntrada: { gte: inicioDia } },
            include: {
                cliente: { select: { nombre: true, apellido: true } },
                registrador: { select: { nombre: true, apellido: true } }
            },
            orderBy: { fechaEntrada: 'desc' }
        })

        res.json(asistencias)

    } catch (error) {
        console.error('Error al obtener historial:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}