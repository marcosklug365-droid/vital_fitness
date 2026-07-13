import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ─── LOGIN DE CLIENTE ──────────────────────────────────────────
export const loginCliente = async (req, res) => {
  try {
    const { dni, password } = req.body

    if (!dni || !password) {
      return res.status(400).json({ error: 'Faltan credenciales (DNI y contraseña)' })
    }

    const cliente = await prisma.cliente.findUnique({ where: { dni } })

    if (!cliente || !cliente.activo || !cliente.accesoWebEnabled) {
      return res.status(401).json({ error: 'Credenciales inválidas o acceso web no habilitado' })
    }

    if (!cliente.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const passwordValida = await bcrypt.compare(password, cliente.password)
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Si es válido, generamos el token JWT
    const token = jwt.sign(
      { 
        id: cliente.id, 
        dni: cliente.dni, 
        rol: 'cliente' // Etiqueta estricta para diferenciar de los usuarios del staff
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Sesión más larga para clientes en mobile/PWA
    )

    // Actualizamos el último login (de forma asíncrona, no bloqueante)
    prisma.cliente.update({
      where: { id: cliente.id },
      data: { ultimoLogin: new Date() }
    }).catch(console.error)

    res.json({
      token,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni: cliente.dni,
        requiereCambioPassword: cliente.requiereCambioPassword
      }
    })

  } catch (error) {
    console.error('Error en login de cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ─── CAMBIAR CONTRASEÑA ───────────────────────────────────────
export const cambiarPasswordCliente = async (req, res) => {
  try {
    const clienteId = req.usuario.id // Viene del middleware verificarTokenCliente
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Debe proveer la contraseña actual y la nueva' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
    }

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })

    const passwordValida = await bcrypt.compare(oldPassword, cliente.password)
    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        password: hashedNewPassword,
        requiereCambioPassword: false,
        ultimoCambioPassword: new Date()
      }
    })

    res.json({ mensaje: 'Contraseña actualizada correctamente' })

  } catch (error) {
    console.error('Error al cambiar contraseña de cliente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
