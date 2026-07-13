import { Router } from 'express'
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  generarCredencialesWeb
} from '../controllers/clientesController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

router.get('/',     getClientes)
router.get('/:id',  getClienteById)
router.post('/',    soloDueno, createCliente)
router.put('/:id',  soloDueno, updateCliente)
router.delete('/:id', soloDueno, deleteCliente)

// Generar o restablecer credenciales web para el cliente (el dueño o staff con permiso)
router.post('/:id/credenciales', generarCredencialesWeb)

export default router