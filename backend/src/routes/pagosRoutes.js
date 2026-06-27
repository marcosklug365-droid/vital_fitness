import { Router } from 'express'
import {
  getPagos,
  getResumenPagos,
  getPagosPorCliente,
  createPago
} from '../controllers/pagosController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

// IMPORTANTE: las rutas específicas van ANTES de las rutas con :id
// para que Express no confunda "resumen" o "cliente" con un ID
router.get('/resumen',        soloDueno, getResumenPagos)
router.get('/cliente/:id',    getPagosPorCliente)
router.get('/',                soloDueno, getPagos)
router.post('/',               soloDueno, createPago)

export default router
