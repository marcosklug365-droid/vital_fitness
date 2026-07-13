import { prisma } from '../lib/prisma.js'

// ─── OBTENER TODOS LOS CLIENTES ──────────────────────────────────
export const getClientes = async (req, res) => {
  try {
    const { filtro, busqueda, exacto } = req.query

    // Construimos el filtro de búsqueda dinámicamente
    let where = {}

    // Filtro por texto: busca en nombre, apellido o DNI
    if (busqueda) {
      if (exacto === 'true') {
        // Búsqueda exacta por DNI (usada por el Wizard de Inscripción para detectar clientes existentes)
        where.dni = busqueda
      } else {
        where.OR = [
          { nombre:   { contains: busqueda, mode: 'insensitive' } },
          { apellido: { contains: busqueda, mode: 'insensitive' } },
          { dni:      { contains: busqueda, mode: 'insensitive' } },
        ]
      }
    }

    // Filtro por estado
    if (filtro === 'inactivos') {
      where.activo = false
    } else {
      where.activo = true
    }

    // Traemos todos los clientes con su membresía activa incluida
    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        membresias: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1  // Solo la membresía más reciente
        }
      },
      orderBy: { apellido: 'asc' }
    })

    // Calculamos el estado de cada cliente en base a su membresía
    const clientesConEstado = clientes.map(cliente => {
      const membresia = cliente.membresias[0]
      let estado = 'sin_membresia'

      if (membresia) {
        const hoy = new Date()
        const vencimiento = new Date(membresia.fechaVencimiento)
        const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

        if (diasRestantes > 3)  estado = 'activo'
        else if (diasRestantes > 0) estado = 'por_vencer'
        else estado = 'vencido'
      }

      return { ...cliente, estado, membresia: cliente.membresias[0] || null }
    })

    // Aplicamos filtros de estado después de calcularlos
    let resultado = clientesConEstado
    if (filtro === 'activos')    resultado = clientesConEstado.filter(c => c.estado === 'activo')
    if (filtro === 'morosos')    resultado = clientesConEstado.filter(c => c.estado === 'vencido')
    if (filtro === 'por_vencer') resultado = clientesConEstado.filter(c => c.estado === 'por_vencer')

    res.json(resultado)

  } catch (error) {
    console.error('Error al obtener clientes:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── OBTENER UN CLIENTE POR ID (con historial completo) ──────────
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        membresias: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' }
        },
        pagos: {
          orderBy: { fechaPago: 'desc' }
        },
        asistencias: {
          include: { registrador: { select: { nombre: true, apellido: true } } },
          orderBy: { fechaEntrada: 'desc' },
          take: 20
        }
      }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Calculamos el estado de la membresía activa
    const membresia = cliente.membresias[0]
    let estado = 'sin_membresia'

    if (membresia) {
      const hoy = new Date()
      const vencimiento = new Date(membresia.fechaVencimiento)
      const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

      if (diasRestantes > 3)  estado = 'activo'
      else if (diasRestantes > 0) estado = 'por_vencer'
      else estado = 'vencido'
    }

    res.json({ ...cliente, estado })

  } catch (error) {
    console.error('Error al obtener cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── CREAR UN CLIENTE ─────────────────────────────────────────────
export const createCliente = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      telefono,
      email,
      fechaNacimiento,
      direccion,
      contactoDeEmergencia
    } = req.body

    // Validaciones básicas
    if (!nombre || !apellido || !dni) {
      return res.status(400).json({
        error: 'Nombre, apellido y DNI son obligatorios'
      })
    }

    // Verificamos que no exista otro cliente con el mismo DNI
    const existe = await prisma.cliente.findUnique({ where: { dni } })
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese DNI' })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        dni,
        telefono:           telefono || null,
        email:              email || null,
        fechaNacimiento:    fechaNacimiento ? new Date(fechaNacimiento) : null,
        direccion:          direccion || null,
        contactoDeEmergencia: contactoDeEmergencia || null,
      }
    })

    res.status(201).json(cliente)

  } catch (error) {
    console.error('Error al crear cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── EDITAR UN CLIENTE ────────────────────────────────────────────
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params
    const {
      nombre,
      apellido,
      dni,
      telefono,
      email,
      fechaNacimiento,
      direccion,
      contactoDeEmergencia,
      activo
    } = req.body

    // Verificamos que el cliente existe
    const clienteExiste = await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    })

    if (!clienteExiste) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Si cambiaron el DNI verificamos que no exista en otro cliente
    if (dni && dni !== clienteExiste.dni) {
      const dniDuplicado = await prisma.cliente.findUnique({ where: { dni } })
      if (dniDuplicado) {
        return res.status(400).json({ error: 'Ya existe un cliente con ese DNI' })
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        apellido,
        dni,
        telefono:           telefono || null,
        email:              email || null,
        fechaNacimiento:    fechaNacimiento ? new Date(fechaNacimiento) : null,
        direccion:          direccion || null,
        contactoDeEmergencia: contactoDeEmergencia || null,
        activo:             activo !== undefined ? activo : clienteExiste.activo
      }
    })

    res.json(cliente)

  } catch (error) {
    console.error('Error al editar cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── ELIMINAR UN CLIENTE (BORRADO LÓGICO) ─────────────────────────
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Borrado lógico: cambiamos activo a false en vez de borrar el registro físico
    await prisma.cliente.update({ 
      where: { id: parseInt(id) },
      data: { activo: false }
    })

    res.json({ mensaje: 'Cliente eliminado correctamente' })

  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── GENERAR / RESTABLECER ACCESO WEB ─────────────────────────────
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const generarCredencialesWeb = async (req, res) => {
  try {
    const { id } = req.params
    const clienteId = parseInt(id)

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })

    // 1. Generar contraseña aleatoria de 8 caracteres (mayúsculas, minúsculas y números)
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let rawPassword = ''
    for (let i = 0; i < 8; i++) {
      const randomIndex = crypto.randomInt(0, charset.length)
      rawPassword += charset[randomIndex]
    }

    // 2. Hashear la contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds)

    // 3. Actualizar el cliente en Prisma
    await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        password: hashedPassword,
        requiereCambioPassword: true,
        accesoWebEnabled: true
      }
    })

    // 4. Devolver la contraseña en texto plano (SOLO ESTA VEZ) para que el staff se la dé al cliente
    res.json({ 
      mensaje: 'Credenciales generadas correctamente',
      passwordTemporal: rawPassword
    })

  } catch (error) {
    console.error('Error al generar credenciales:', error)
    res.status(500).json({ error: 'Error interno del servidor al generar credenciales' })
  }
}