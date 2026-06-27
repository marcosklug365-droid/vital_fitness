import { Router } from 'express'
import {
  getMembresias,
  getMembresiasPorVencer,
  renovarMembresia,
  suspenderMembresia
} from '../controllers/membresiasController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

router.get('/',           getMembresias)
router.get('/por-vencer', getMembresiasPorVencer)
router.post('/renovar',   soloDueno, renovarMembresia)
router.put('/:id/suspender', soloDueno, suspenderMembresia)

export default router