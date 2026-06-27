import { prisma } from '../lib/prisma.js'

// ─── OBTENER TODAS LAS CLASES (vista semanal) ──────────────
export const getClases = async (req, res) => {
    try {
        const clases = await prisma.clase.findMany({
            where: { activa: true },
            include: {
                instructor: { select: { id: true, nombre: true, apellido: true } },
                // _count nos dice cuántos inscriptos tiene cada clase
                // sin necesidad de traer todas las inscripciones completas
                _count: { select: { inscripciones: { where: { estado: 'confirmada' } } } }
            },
            orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
        })

        res.json(clases)

    } catch (error) {
        console.error('Error al obtener clases:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── VER UNA CLASE CON SUS INSCRIPTOS ──────────────
export const getClaseById = async (req, res) => {
    try {
        const { id } = req.params

        const clase = await prisma.clase.findUnique({
            where: { id: parseInt(id) },
            include: {
                instructor: { select: { id: true, nombre: true, apellido: true } },
                inscripciones: {
                    where: { estado: 'confirmada' },
                    include: {
                        cliente: {
                            include: {
                                membresias: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!clase) {
            return res.status(404).json({ error: 'Clase no encontrada' })
        }

        // Le calculamos el estado de membresía a cada inscripto
        // (igual lógica que usamos en clientesController)
        const inscripcionesConEstado = clase.inscripciones.map(insc => {
            const membresia = insc.cliente.membresias[0]
            let estadoMembresia = 'sin_membresia'

            if (membresia) {
                const diasRestantes = Math.ceil(
                    (new Date(membresia.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24)
                )
                estadoMembresia = diasRestantes < 0 ? 'vencido' : 'activo'
            }

            return { ...insc, estadoMembresia }
        })

        res.json({ ...clase, inscripciones: inscripcionesConEstado })

    } catch (error) {
        console.error('Error al obtener clase:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── CREAR UNA CLASE ──────────────
export const createClase = async (req, res) => {
    try {
        const {
            nombre, descripcion, instructorId,
            diaSemana, horaInicio, horaFin, capacidadMaxima
        } = req.body

        if (!nombre || !instructorId || !diaSemana || !horaInicio || !horaFin || !capacidadMaxima) {
            return res.status(400).json({
                error: 'Nombre, instructor, día, horario y capacidad son obligatorios'
            })
        }

        // Verificamos que el instructor exista y sea un usuario válido
        const instructor = await prisma.usuario.findUnique({ where: { id: parseInt(instructorId) } })
        if (!instructor) {
            return res.status(404).json({ error: 'Instructor no encontrado' })
        }

        const clase = await prisma.clase.create({
            data: {
                nombre,
                descripcion: descripcion || null,
                instructorId: parseInt(instructorId),
                diaSemana,
                horaInicio,
                horaFin,
                capacidadMaxima: parseInt(capacidadMaxima),
                activa: true
            },
            include: { instructor: { select: { nombre: true, apellido: true } } }
        })

        res.status(201).json(clase)

    } catch (error) {
        console.error('Error al crear clase:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── EDITAR UNA CLASE ──────────────
export const updateClase = async (req, res) => {
    try {
        const { id } = req.params
        const {
            nombre, descripcion, instructorId,
            diaSemana, horaInicio, horaFin, capacidadMaxima, activa
        } = req.body

        const claseExiste = await prisma.clase.findUnique({ where: { id: parseInt(id) } })
        if (!claseExiste) {
            return res.status(404).json({ error: 'Clase no encontrada' })
        }

        const clase = await prisma.clase.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion: descripcion ?? claseExiste.descripcion,
                instructorId: instructorId ? parseInt(instructorId) : claseExiste.instructorId,
                diaSemana: diaSemana || claseExiste.diaSemana,
                horaInicio: horaInicio || claseExiste.horaInicio,
                horaFin: horaFin || claseExiste.horaFin,
                capacidadMaxima: capacidadMaxima ? parseInt(capacidadMaxima) : claseExiste.capacidadMaxima,
                activa: activa !== undefined ? activa : claseExiste.activa
            }
        })

        res.json(clase)

    } catch (error) {
        console.error('Error al editar clase:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── ELIMINAR UNA CLASE ──────────────
export const deleteClase = async (req, res) => {
    try {
        const { id } = req.params

        // Si tiene inscripciones, las eliminamos en cascada usando una transacción
        // así no queda basura huérfana en la tabla de inscripciones
        await prisma.$transaction(async (tx) => {
            await tx.inscripcion.deleteMany({ where: { claseId: parseInt(id) } })
            await tx.clase.delete({ where: { id: parseInt(id) } })
        })

        res.json({ mensaje: 'Clase eliminada correctamente' })

    } catch (error) {
        console.error('Error al eliminar clase:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// ─── OBTENER INSTRUCTORES (para el selector del formulario) ──────────────
export const getInstructores = async (req, res) => {
    try {
        const instructores = await prisma.usuario.findMany({
            where: { activo: true }, // dueño y entrenadores pueden dar clases
            select: { id: true, nombre: true, apellido: true, rol: true }
        })
        res.json(instructores)
    } catch (error) {
        console.error('Error al obtener instructores:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}