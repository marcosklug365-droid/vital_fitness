import { Router } from 'express'
import { getPerfilCliente } from '../controllers/portalController.js'
import { precheckQr, confirmarQr } from '../controllers/portalQrController.js'
import { verificarTokenCliente } from '../middlewares/authMiddleware.js'

const router = Router()

// Todas las rutas del portal del cliente están protegidas por su token
router.use(verificarTokenCliente)

router.get('/perfil', getPerfilCliente)
router.post('/qr/precheck', precheckQr)
router.post('/qr/confirm', confirmarQr)

export default router
