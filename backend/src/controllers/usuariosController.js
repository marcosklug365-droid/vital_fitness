import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

// Obtener todos los usuarios del staff
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
        _count: {
          select: { clases: true }
        }
      },
      orderBy: { creadoEn: 'desc' }
    })
    res.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Crear un nuevo usuario (Staff)
export const createUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body

    // Validaciones
    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    // Verificar email único
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        rol,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true
      }
    })

    res.status(201).json(nuevoUsuario)
  } catch (error) {
    console.error('Error al crear usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Actualizar un usuario (datos básicos)
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, apellido, rol } = req.body

    // Validar si el usuario intenta modificarse a sí mismo para quitarse privilegios
    if (req.usuario.id === parseInt(id) && rol && rol !== req.usuario.rol) {
       return res.status(403).json({ error: 'No podés cambiar tu propio rol por seguridad' })
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { nombre, apellido, rol },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true
      }
    })

    res.json(usuarioActualizado)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Activar / Desactivar (Borrado lógico)
export const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params
    
    // Evitar que el dueño se desactive a sí mismo
    if (req.usuario.id === parseInt(id)) {
      return res.status(403).json({ error: 'No podés desactivar tu propio usuario' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(id) } })
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { activo: !usuario.activo },
      select: { id: true, activo: true }
    })

    res.json(usuarioActualizado)
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
