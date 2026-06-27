import { Router } from 'express'
import { login, getPerfil } from '../controllers/authController.js'
import { verificarToken } from '../middlewares/authMiddleware.js'

const router = Router()

// POST /api/auth/login -> no requiere token, es el endpoint de acceso
router.post('/login', login)

// GET /api/auth/perfil -> requiere token, devuelve datos del usuario logueado
router.get('/perfil', verificarToken, getPerfil)

export default router