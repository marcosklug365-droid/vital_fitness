import { Router } from 'express'
import {
    getAforo,
    registrarEntrada,
    registrarSalida,
    getHistorialHoy,
    forzarIngreso
} from '../controllers/asistenciasController.js'
import { verificarToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

// Tanto dueño como entrenador pueden registrar entradas/salidas
router.get('/aforo', getAforo)
router.get('/historial-hoy', getHistorialHoy)
router.post('/entrada', registrarEntrada)
router.post('/forzar-entrada', forzarIngreso)
router.put('/salida/:id', registrarSalida)

export default router