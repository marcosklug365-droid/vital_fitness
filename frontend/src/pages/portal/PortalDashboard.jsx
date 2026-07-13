import { useState, useEffect } from 'react'
import { getPerfilClienteService } from '../../services/portalService'
import { Calendar, QrCode, CreditCard, Activity, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PortalDashboard() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await getPerfilClienteService()
        setData(res)
      } catch (error) {
        console.error(error)
      } finally {
        setCargando(false)
      }
    }
    fetchPerfil()
  }, [])

  if (cargando) {
    return <div className="p-6 text-center text-gray-500 mt-20">Cargando tu información...</div>
  }

  if (!data) {
    return <div className="p-6 text-center text-red-400 mt-20">No se pudo cargar la información.</div>
  }

  const { membresiaActiva, ultimaAsistencia, ultimoPago, asistenciasDelMes } = data
  
  // Calcular días restantes de la membresía activa
  let diasRestantes = 0
  let porcentaje = 0
  let vencida = false

  if (membresiaActiva) {
    const hoy = new Date()
    const vencimiento = new Date(membresiaActiva.fechaVencimiento)
    const inicio = new Date(membresiaActiva.fechaInicio)
    
    diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
    if (diasRestantes < 0) {
      diasRestantes = 0
      vencida = true
    } else {
      const totalDias = Math.ceil((vencimiento - inicio) / (1000 * 60 * 60 * 24))
      const transcurridos = totalDias - diasRestantes
      porcentaje = Math.min(100, Math.max(0, (transcurridos / totalDias) * 100))
    }
  } else {
    vencida = true
  }

  return (
    <div className="p-5 pb-8 space-y-6">
      
      {/* Tarjeta Principal de Membresía */}
      <div className={`relative overflow-hidden rounded-2xl p-6 shadow-2xl border ${vencida ? 'border-red-500/30 bg-gradient-to-br from-red-900/40 to-black' : 'border-[#AAFF00]/30 bg-gradient-to-br from-[#1a2900] to-[#111111]'}`}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Membresía Actual</p>
            <h2 className="text-2xl font-black text-white">
              {membresiaActiva ? membresiaActiva.plan.nombre : 'Sin Plan Activo'}
            </h2>
          </div>
          {vencida ? (
            <div className="bg-red-500/20 text-red-400 p-2 rounded-lg">
              <AlertCircle size={20} />
            </div>
          ) : (
            <div className="bg-[#AAFF00]/20 text-[#AAFF00] p-2 rounded-lg">
              <ShieldCheck size={20} />
            </div>
          )}
        </div>

        {membresiaActiva && !vencida ? (
          <>
            <div className="flex items-end gap-2 mb-4 relative z-10">
              <span className="text-5xl font-black text-[#AAFF00] tracking-tighter">{diasRestantes}</span>
              <span className="text-gray-400 text-sm mb-1 font-medium tracking-wide">DÍAS RESTANTES</span>
            </div>
            
            <div className="w-full bg-black/50 rounded-full h-2.5 mb-2 border border-[#333333] relative z-10">
              <div 
                className="bg-[#AAFF00] h-2.5 rounded-full" 
                style={{ width: `${porcentaje}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 text-right relative z-10">
              Vence el {new Date(membresiaActiva.fechaVencimiento).toLocaleDateString('es-AR')}
            </p>
          </>
        ) : (
          <div className="py-4 relative z-10">
            <p className="text-red-400 font-medium">Tu membresía está vencida.</p>
            <p className="text-gray-400 text-sm mt-1">Acercate a recepción para renovarla.</p>
          </div>
        )}
      </div>

      {/* Botón QR Destacado */}
      <button 
        onClick={() => navigate('/portal/escaner')}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-transform active:scale-95 ${
          vencida 
            ? 'bg-[#222222] text-gray-500 border border-[#333333] cursor-not-allowed opacity-80' 
            : 'bg-[#AAFF00] text-black hover:bg-[#99e600]'
        }`}
        disabled={vencida}
      >
        <QrCode size={24} />
        {vencida ? 'Acceso Bloqueado' : 'Escanear Código de Ingreso'}
      </button>

      {/* Grid de Estadísticas Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#333333] p-4 rounded-xl flex flex-col justify-between">
          <div className="text-gray-500 mb-2"><Activity size={20} /></div>
          <p className="text-2xl font-bold text-white">{asistenciasDelMes}</p>
          <p className="text-xs text-gray-400">Asistencias este mes</p>
        </div>
        
        <div className="bg-[#111111] border border-[#333333] p-4 rounded-xl flex flex-col justify-between">
          <div className="text-gray-500 mb-2"><Calendar size={20} /></div>
          <p className="text-sm font-bold text-white leading-tight">
            {ultimaAsistencia ? new Date(ultimaAsistencia.fechaEntrada).toLocaleDateString('es-AR') : 'Ninguna'}
          </p>
          <p className="text-xs text-gray-400">Última visita</p>
        </div>
      </div>

      {/* Acceso Rápido a Pagos */}
      <div 
        onClick={() => navigate('/portal/historial')}
        className="bg-[#111111] border border-[#333333] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1a] p-2 rounded-lg text-gray-400">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Último Pago</p>
            <p className="text-gray-500 text-xs">
              {ultimoPago ? `$${ultimoPago.monto} el ${new Date(ultimoPago.fechaPago).toLocaleDateString('es-AR')}` : 'Sin pagos registrados'}
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="text-gray-600" />
      </div>

    </div>
  )
}
