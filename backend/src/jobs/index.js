import { verificarVencimientos } from './vencimientosJob.js'

export const initJobs = () => {
    console.log('⏳ Inicializando Cron Jobs...')
    verificarVencimientos()
}
