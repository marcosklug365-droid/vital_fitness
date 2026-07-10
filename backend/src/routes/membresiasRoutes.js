import { Router } from 'express'
import {
  getMembresias,
  getMembresiasPorVencer,
  renovarMembresia,
  suspenderMembresia,
  inscribirCliente
} from '../controllers/membresiasController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

router.get('/',              getMembresias)
router.get('/por-vencer',   getMembresiasPorVencer)
// Inscripción unificada: cualquier usuario autenticado puede inscribir (dueño o entrenador)
router.post('/inscribir',   inscribirCliente)
router.post('/renovar',     soloDueno, renovarMembresia)
router.put('/:id/suspender', soloDueno, suspenderMembresia)

export default router