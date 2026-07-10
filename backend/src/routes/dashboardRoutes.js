import { Router } from 'express'
import { getDashboard } from '../controllers/dashboardController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

// Solo el dueño ve este dashboard agregado
// El entrenador usa los datos de /asistencias/aforo y /clases que ya existen
router.get('/', soloDueno, getDashboard)

export default router