import { Router } from 'express'
import { loginCliente, cambiarPasswordCliente } from '../controllers/authClienteController.js'
import { verificarTokenCliente } from '../middlewares/authMiddleware.js'

const router = Router()

// Endpoint público para login de clientes
router.post('/login', loginCliente)

// Endpoints protegidos para clientes
router.use(verificarTokenCliente)
router.post('/cambiar-password', cambiarPasswordCliente)

export default router
