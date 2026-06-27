import { Router } from 'express'
import {
    getClases,
    getClaseById,
    createClase,
    updateClase,
    deleteClase,
    getInstructores
} from '../controllers/clasesController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

// IMPORTANTE: /instructores debe ir antes de /:id
router.get('/instructores', getInstructores)
router.get('/', getClases)
router.get('/:id', getClaseById)
router.post('/', soloDueno, createClase)
router.put('/:id', soloDueno, updateClase)
router.delete('/:id', soloDueno, deleteClase)

export default router