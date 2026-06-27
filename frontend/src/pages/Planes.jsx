import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getPlanesService,
  createPlanService,
  updatePlanService,
  deletePlanService
} from '../services/planesService'
import { Plus, Pencil, Trash2, X, Save, ClipboardList } from 'lucide-react'

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(monto)
}

// ─── Modal de crear/editar plan ───────────────────────
function ModalPlan({ plan, onClose, onGuardado }) {
  const esEdicion = Boolean(plan)
  const [form, setForm] = useState({
    nombre: plan?.nombre || '',
    descripcion: plan?.descripcion || '',
    precio: plan?.precio || '',
    duracionDias: plan?.duracionDias || '',
    activo: plan?.activo ?? true
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      if (esEdicion) {
        await updatePlanService(plan.id, form)
      } else {
        await createPlanService(form)
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el plan')
    } finally {
      setGuardando(false)
    }
  }

  const estiloInput = "w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#AAFF00] transition-colors"

  // Calculamos el precio por día para la vista previa
  const precioPorDia = form.precio && form.duracionDias
    ? (form.precio / form.duracionDias).toFixed(0)
    : null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#111111] border border-[#AAFF00]/30 rounded-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()} // evita que se cierre al hacer clic dentro
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">
            {esEdicion ? 'Editar plan' : 'Crear nuevo plan'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="border-t border-[#333333] mb-5"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1.5">Nombre del plan *</label>
            <input
              name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej: Mensual, Trimestral..."
              className={estiloInput} required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-1.5">Descripción</label>
            <textarea
              name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="Describí brevemente qué incluye este plan..."
              className={`${estiloInput} h-20 resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1.5">Precio *</label>
              <input
                type="number" name="precio" value={form.precio} onChange={handleChange}
                placeholder="Ej: 8000"
                className={estiloInput} required
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1.5">Duración en días *</label>
              <input
                type="number" name="duracionDias" value={form.duracionDias} onChange={handleChange}
                placeholder="Ej: 30"
                className={estiloInput} required
              />
              <p className="text-gray-600 text-xs mt-1">30 = mensual, 90 = trimestral</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3">
            <div>
              <p className="text-white text-sm">Plan activo</p>
              <p className="text-gray-500 text-xs">Los planes inactivos no aparecen al asignar membresías</p>
            </div>
            <input
              type="checkbox" name="activo" checked={form.activo} onChange={handleChange}
              className="w-5 h-5 accent-[#AAFF00]"
            />
          </div>

          {/* Vista previa */}
          {precioPorDia && (
            <div className="bg-[#0a0a0a] border border-[#AAFF00]/30 rounded-lg px-4 py-3">
              <p className="text-[#AAFF00] text-xs font-semibold mb-1">Vista previa</p>
              <p className="text-gray-400 text-xs">Equivale a {formatearMonto(precioPorDia)}/día</p>
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
              <Save size={14} />
              {guardando ? 'Guardando...' : 'Guardar plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tarjeta de plan ───────────────────────
function PlanCard({ plan, esDueno, esMasPopular, onEditar, onEliminar }) {
  return (
    <div className={`bg-[#111111] border rounded-xl p-6 relative ${esMasPopular ? 'border-[#AAFF00]/50' : 'border-[#333333]'}`}>
      {esMasPopular && (
        <span className="absolute top-4 right-4 bg-[#AAFF00] text-black text-xs font-bold px-2.5 py-1 rounded-full">
          ⭐ Más popular
        </span>
      )}

      <h3 className="text-white font-bold text-xl mb-2">{plan.nombre}</h3>
      <span className="inline-block bg-[#0a0a0a] text-gray-400 text-xs px-2.5 py-1 rounded-full mb-4">
        {plan.duracionDias} días
      </span>

      <div className="border-t border-[#333333] my-3"></div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-[#AAFF00] font-bold text-3xl">{formatearMonto(plan.precio)}</span>
      </div>

      <p className="text-gray-500 text-sm mb-3">👥 {plan._count?.membresias || 0} socios activos</p>

      <div className="border-t border-[#333333] my-3"></div>

      <p className="text-gray-400 text-sm mb-4">{plan.descripcion || 'Sin descripción'}</p>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          plan.activo ? 'bg-[#AAFF00]/20 text-[#AAFF00]' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {plan.activo ? 'Activo' : 'Inactivo'}
        </span>

        {esDueno && (
          <div className="flex gap-2">
            <button onClick={() => onEditar(plan)} className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#AAFF00] transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => onEliminar(plan)} className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Planes() {
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [planEditando, setPlanEditando] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)

  const { usuario } = useAuth()
  const esDueno = usuario?.rol === 'dueno'

  useEffect(() => { cargarPlanes() }, [])

  const cargarPlanes = async () => {
    try {
      setCargando(true)
      const data = await getPlanesService()
      setPlanes(data)
    } catch (error) {
      console.error('Error al cargar planes:', error)
    } finally {
      setCargando(false)
    }
  }

  const abrirCrear = () => { setPlanEditando(null); setMostrarModal(true) }
  const abrirEditar = (plan) => { setPlanEditando(plan); setMostrarModal(true) }

  const handleGuardado = () => {
    setMostrarModal(false)
    cargarPlanes()
  }

  const handleEliminar = async (plan) => {
    const confirmado = window.confirm(`¿Eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    try {
      await deletePlanService(plan.id)
      cargarPlanes()
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el plan')
    }
  }

  // El plan con más socios activos se marca como "más popular"
  const planMasPopularId = planes.length > 0
    ? planes.reduce((max, p) => (p._count?.membresias > (max._count?.membresias || 0) ? p : max), planes[0]).id
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Planes</h2>
          <p className="text-gray-500 text-sm mt-1">Gestioná los tipos de membresía del gimnasio</p>
        </div>
        {esDueno && (
          <button onClick={abrirCrear} className="flex items-center gap-2 bg-[#AAFF00] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#99ee00] transition-colors">
            <Plus size={16} />
            Crear plan
          </button>
        )}
      </div>

      {cargando ? (
        <div className="py-16 text-center text-gray-500">Cargando planes...</div>
      ) : planes.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <ClipboardList size={48} className="text-gray-700" />
          <p className="text-white font-medium">No hay planes creados aún</p>
          <p className="text-gray-500 text-sm text-center max-w-sm">
            Creá el primer plan de membresía para empezar a asignarlos a tus socios.
          </p>
          {esDueno && (
            <button onClick={abrirCrear} className="mt-2 bg-[#AAFF00] text-black font-bold px-4 py-2 rounded-lg text-sm">
              + Crear primer plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {planes.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              esDueno={esDueno}
              esMasPopular={plan.id === planMasPopularId && plan._count?.membresias > 0}
              onEditar={abrirEditar}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {mostrarModal && (
        <ModalPlan
          plan={planEditando}
          onClose={() => setMostrarModal(false)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  )
}

export default Planes