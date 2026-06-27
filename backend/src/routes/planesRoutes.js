import { Router } from 'express'
import { getPlanes, createPlan, updatePlan, deletePlan } from '../controllers/planesController.js'
import { verificarToken, soloDueno } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(verificarToken)

router.get('/',       getPlanes)        // cualquiera logueado puede ver los planes
router.post('/',      soloDueno, createPlan)
router.put('/:id',    soloDueno, updatePlan)
router.delete('/:id', soloDueno, deletePlan)

export default router