import { useState, useEffect } from 'react'
import {
  getMembresiasPorVencerService,
  renovarMembresiaService
} from '../services/membresiasService'
import { getPlanesService } from '../services/planesService'
import { X, RefreshCw, CheckCircle2 } from 'lucide-react'

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(monto)
}

// ─── Modal de renovación ───────────────────────
function ModalRenovar({ membresia, planes, onClose, onRenovado }) {
  const [planId, setPlanId] = useState(membresia.planId)
  const [medioPago, setMedioPago] = useState('efectivo')
  const [monto, setMonto] = useState(membresia.plan.precio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Cuando cambia el plan seleccionado, actualizamos el monto sugerido automáticamente
  const handleCambiarPlan = (id) => {
    setPlanId(id)
    const planSeleccionado = planes.find(p => p.id === parseInt(id))
    if (planSeleccionado) setMonto(planSeleccionado.precio)
  }

  const planSeleccionado = planes.find(p => p.id === parseInt(planId))
  const fechaInicio = new Date()
  const fechaNuevoVencimiento = planSeleccionado
    ? new Date(fechaInicio.getTime() + planSeleccionado.duracionDias * 24 * 60 * 60 * 1000)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await renovarMembresiaService({
        clienteId: membresia.clienteId,
        planId: parseInt(planId),
        medioPago,
        monto: parseFloat(monto)
      })
      onRenovado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al renovar la membresía')
    } finally {
      setGuardando(false)
    }
  }

  const estiloInput = "w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#AAFF00] transition-colors"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-[#AAFF00]/30 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">🔄 Renovar membresía</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        {/* Resumen del cliente */}
        <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-sm">
              {membresia.cliente.nombre.charAt(0)}{membresia.cliente.apellido.charAt(0)}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{membresia.cliente.nombre} {membresia.cliente.apellido}</p>
              <p className="text-red-400 text-xs">Plan actual: {membresia.plan.nombre}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1.5">Nuevo plan *</label>
            <select value={planId} onChange={(e) => handleCambiarPlan(e.target.value)} className={estiloInput} required>
              {planes.filter(p => p.activo).map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {formatearMonto(p.precio)} — {p.duracionDias} días
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white text-sm mb-1.5">Medio de pago *</label>
            <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)} className={estiloInput} required>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta_de_debito">Tarjeta de Débito</option>
            </select>
          </div>

          <div>
            <label className="block text-white text-sm mb-1.5">Monto a cobrar *</label>
            <input
              type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
              className={estiloInput} required
            />
            <p className="text-gray-600 text-xs mt-1">Podés modificar el monto si aplicás un descuento</p>
          </div>

          {/* Resumen de la renovación */}
          {planSeleccionado && (
            <div className="bg-[#0a0a0a] border border-[#AAFF00]/30 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-400">Plan: <span className="text-white">{planSeleccionado.nombre}</span></p>
              <p className="text-gray-400">Monto: <span className="text-white">{formatearMonto(monto)}</span></p>
              <p className="text-gray-400">Inicio: <span className="text-white">{formatearFecha(fechaInicio)}</span></p>
              <p className="text-gray-400">Vence: <span className="text-[#AAFF00] font-semibold">{formatearFecha(fechaNuevoVencimiento)}</span></p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2.5">
              <p className="text-red-400 text-sm">⚠️ {error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#333333] text-gray-400 hover:text-white text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex items-center gap-2 bg-[#AAFF00] text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              <CheckCircle2 size={14} />
              {guardando ? 'Procesando...' : 'Confirmar renovación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Membresias() {
  const [membresias, setMembresias] = useState([])
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [membresiaRenovando, setMembresiaRenovando] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [dataMembresias, dataPlanes] = await Promise.all([
        getMembresiasPorVencerService(),
        getPlanesService()
      ])
      setMembresias(dataMembresias)
      setPlanes(dataPlanes)
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
                  onClick={() => setMembresiaRenovando(m)}
                  className="flex items-center gap-1.5 bg-[#AAFF00] text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#99ee00] transition-colors"
                >
                  <RefreshCw size={12} />
                  Renovar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {membresiaRenovando && (
        <ModalRenovar
          membresia={membresiaRenovando}
          planes={planes}
          onClose={() => setMembresiaRenovando(null)}
          onRenovado={handleRenovado}
        />
      )}
    </div>
  )
}

export default Membresias