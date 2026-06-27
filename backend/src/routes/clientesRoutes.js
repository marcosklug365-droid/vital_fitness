import { Router } from 'express'
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} from '../controllers/clientesController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

// Todas las rutas de clientes requieren estar logueado
// El middleware verificarToken se aplica a todas las rutas del router
router.use(verificarToken)

// GET  /api/clientes         → cualquier usuario logueado puede ver clientes
// GET  /api/clientes/:id     → cualquier usuario logueado puede ver el detalle
// POST /api/clientes         → solo el dueño puede crear clientes
// PUT  /api/clientes/:id     → solo el dueño puede editar clientes
// DELETE /api/clientes/:id   → solo el dueño puede eliminar clientes

router.get('/',     getClientes)
router.get('/:id',  getClienteById)
router.post('/',    soloDueno, createCliente)
router.put('/:id',  soloDueno, updateCliente)
router.delete('/:id', soloDueno, deleteCliente)

export default router