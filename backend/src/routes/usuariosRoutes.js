import express from 'express'
import { getUsuarios, createUsuario, updateUsuario, toggleActivo } from '../controllers/usuariosController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Todas las rutas de staff están protegidas y solo accesibles por dueños
router.use(verificarToken)
router.use(soloDueno)

router.get('/', getUsuarios)
router.post('/', createUsuario)
router.put('/:id', updateUsuario)
router.patch('/:id/toggle', toggleActivo)

export default router
