import cron from 'node-cron'
import { prisma } from '../lib/prisma.js'

/**
 * Job de Vencimientos
 * Se ejecuta todos los días a las 00:01 AM
 * Busca membresías activas cuya fecha de vencimiento ya pasó
 * y las marca como vencidas en la base de datos.
 */
export const verificarVencimientos = () => {
    // Patrón Cron: min hora dia_mes mes dia_semana
    // "1 0 * * *" = A las 00:01 todos los días
    cron.schedule('1 0 * * *', async () => {
        console.log('🔄 [CRON] Ejecutando verificación de membresías vencidas...')
        
        try {
            const hoy = new Date()
            
            // Buscar y actualizar en una sola transacción para mayor eficiencia
            const resultado = await prisma.membresia.updateMany({
                where: {
                    estado: 'activa',
                    fechaVencimiento: {
                        lt: hoy // menor estricto que "ahora"
                    }
                },
                data: {
                    estado: 'vencida'
                }
            })

            console.log(`✅ [CRON] Verificación finalizada. Membresías vencidas actualizadas: ${resultado.count}`)
        } catch (error) {
            console.error('❌ [CRON] Error al verificar vencimientos:', error)
        }
    })
}
