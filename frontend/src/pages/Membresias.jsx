import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembresiasPorVencerService } from '../services/membresiasService'
import { AlertTriangle, Clock, RefreshCw, CheckCircle2, User, CreditCard } from 'lucide-react'

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Membresias() {
  const navigate = useNavigate()
  const [membresias, setMembresias] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const dataMembresias = await getMembresiasPorVencerService()
      setMembresias(dataMembresias)
    } catch (error) {
      console.error('Error al cargar membresías:', error)
    } finally {
      setCargando(false)
    }
  }

  const handleRenovado = () => {
    setMembresiaRenovando(null)
    cargarDatos()
  }

  const vencidasHoy = membresias.filter(m => m.diasRestantes === 0).length
  const porVencer3 = membresias.filter(m => m.estado === 'por_vencer').length
  const vencidas = membresias.filter(m => m.estado === 'vencida').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-2xl">Membresías</h2>
        <p className="text-gray-500 text-sm mt-1">Control de vencimientos y renovaciones</p>
      </div>

      {/* Banner de alerta */}
      {membresias.length > 0 && (
        <div className="bg-[#111111] border-l-4 border-red-500 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">⚠️ Tenés {membresias.length} membresía(s) que requieren atención</p>
            <p className="text-gray-500 text-sm">{vencidas} vencidas y {porVencer3} por vencer en los próximos 3 días</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
          <p className="text-red-400 font-bold text-3xl">{vencidasHoy}</p>
          <p className="text-gray-500 text-sm mt-1">Vencen hoy</p>
        </div>
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
          <p className="text-yellow-400 font-bold text-3xl">{porVencer3}</p>
          <p className="text-gray-500 text-sm mt-1">Por vencer (≤3 días)</p>
        </div>
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
          <p className="text-red-400 font-bold text-3xl">{vencidas}</p>
          <p className="text-gray-500 text-sm mt-1">Ya vencidas</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#111111] border border-[#333333] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#0a0a0a] border-b border-[#333333]">
          <span className="col-span-3 text-gray-500 text-xs uppercase font-semibold">Cliente</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">Plan</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">Vencimiento</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">Días</span>
          <span className="col-span-1 text-gray-500 text-xs uppercase font-semibold">Estado</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold text-right">Acciones</span>
        </div>

        {cargando ? (
          <div className="py-16 text-center text-gray-500">Cargando membresías...</div>
        ) : membresias.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <CheckCircle2 size={48} className="text-[#AAFF00]" />
            <p className="text-white font-bold text-lg">¡Todo al día!</p>
            <p className="text-gray-500 text-sm">No hay membresías vencidas ni próximas a vencer en este momento.</p>
          </div>
        ) : (
          membresias.map((m) => (
            <div
              key={m.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1a1a1a] last:border-0 ${m.estado === 'vencida' ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-yellow-500'
                }`}
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${m.estado === 'vencida' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                  {m.cliente.nombre.charAt(0)}{m.cliente.apellido.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{m.cliente.nombre} {m.cliente.apellido}</p>
                  <p className="text-gray-500 text-xs">{m.cliente.email || '—'}</p>
                </div>
              </div>
              <div className="col-span-2 flex items-center text-gray-300 text-sm">{m.plan.nombre}</div>
              <div className={`col-span-2 flex items-center text-sm font-medium ${m.estado === 'vencida' ? 'text-red-400' : 'text-yellow-400'}`}>
                {formatearFecha(m.fechaVencimiento)}
              </div>
              <div className="col-span-2 flex items-center">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.estado === 'vencida' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                  {m.diasRestantes < 0 ? `Venció hace ${Math.abs(m.diasRestantes)} días` :
                    m.diasRestantes === 0 ? 'Vence hoy' : `${m.diasRestantes} días`}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                <span className={`text-xs font-semibold ${m.estado === 'vencida' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {m.estado === 'vencida' ? '🔴 Vencida' : '🟡 Por vencer'}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <button
                  onClick={() => navigate(`/inscripcion?dni=${m.cliente.dni}`)}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 transition-colors shadow-[0_0_10px_rgba(170,255,0,0.1)]"
                >
                  <RefreshCw size={12} />
                  Renovar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Membresias