import { Router } from 'express'
import { createInscripcion, cancelarInscripcion } from '../controllers/inscripcionesController.js'
import { verificarToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)
// Tanto dueño como entrenador pueden inscribir/cancelar clientes a clases
router.post('/', createInscripcion)
router.put('/:id/cancelar', cancelarInscripcion)

export default router