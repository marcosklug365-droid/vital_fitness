import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getClasesService, getClaseByIdService,
  createClaseService, updateClaseService, deleteClaseService,
  getInstructoresService
} from '../services/clasesService'
import {
  createInscripcionService, cancelarInscripcionService
} from '../services/inscripcionesService'
import { getClientesService } from '../services/clientesService'
import {
  Plus, X, Save, Pencil, Trash2, Search,
  Users, Clock, Calendar as CalendarIcon
} from 'lucide-react'

// ─── Días de la semana, en orden ───────────────────────
const DIAS = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
]

// ─── Paleta de colores para diferenciar clases visualmente ───────────────────────
// No se guarda en la base de datos, se calcula acá mismo en el frontend
const PALETA = [
  { bg: 'bg-[#AAFF00]/10', border: 'border-l-[#AAFF00]', text: 'text-[#AAFF00]' },
  { bg: 'bg-blue-500/10',  border: 'border-l-blue-500',  text: 'text-blue-400'  },
  { bg: 'bg-purple-500/10', border: 'border-l-purple-500', text: 'text-purple-400' },
  { bg: 'bg-orange-500/10', border: 'border-l-orange-500', text: 'text-orange-400' },
]

// Asigna siempre el mismo color a la misma clase, en base a su nombre
function getColorClase(nombre, listaNombres) {
  const indice = listaNombres.indexOf(nombre) % PALETA.length
  return PALETA[indice] || PALETA[0]
}

// ─── Tarjeta de una clase dentro de la grilla ───────────────────────
function ClaseCard({ clase, color, onClick }) {
  const inscriptos = clase._count?.inscripciones || 0
  const lleno = inscriptos >= clase.capacidadMaxima

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border-l-[3px] ${color.bg} ${color.border} hover:brightness-110 transition-all mb-2`}
    >
      <p className={`text-xs font-bold ${color.text}`}>{clase.horaInicio} - {clase.horaFin}</p>
      <p className="text-white text-sm font-semibold mt-0.5">{clase.nombre}</p>
      <p className="text-gray-500 text-xs">{clase.instructor.nombre} {clase.instructor.apellido}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-xs ${lleno ? 'text-red-400 font-bold' : color.text}`}>
          {inscriptos}/{clase.capacidadMaxima}
        </span>
        {lleno && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">LLENO</span>
        )}
      </div>
    </button>
  )
}

// ─── Panel lateral con el detalle de una clase ───────────────────────
function PanelDetalleClase({ claseId, onClose, onCambio, esDueno }) {
  const [clase, setClase] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [resultados, setResultados] = useState([])
  const [agregando, setAgregando] = useState(false)

  useEffect(() => { cargarClase() }, [claseId])

  const cargarClase = async () => {
    try {
      setCargando(true)
      const data = await getClaseByIdService(claseId)
      setClase(data)
    } catch (err) {
      console.error('Error al cargar clase:', err)
    } finally {
      setCargando(false)
    }
  }

  // Buscador de clientes para agregar a la clase (mismo patrón que en Pagos)
  useEffect(() => {
    if (!busquedaCliente) { setResultados([]); return }
    const timer = setTimeout(async () => {
      const data = await getClientesService('', busquedaCliente)
      setResultados(data.slice(0, 5))
    }, 350)
    return () => clearTimeout(timer)
  }, [busquedaCliente])

  const handleAgregar = async (cliente) => {
    try {
      setAgregando(true)
      await createInscripcionService({ claseId: clase.id, clienteId: cliente.id })
      setBusquedaCliente('')
      setResultados([])
      await cargarClase()
      onCambio() // refresca el contador en la grilla principal
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo inscribir al cliente')
    } finally {
      setAgregando(false)
    }
  }

  const handleQuitar = async (inscripcionId) => {
    const confirmado = window.confirm('¿Quitar a este cliente de la clase?')
    if (!confirmado) return
    await cancelarInscripcionService(inscripcionId)
    await cargarClase()
    onCambio()
  }

  const handleEliminarClase = async () => {
    const confirmado = window.confirm(`¿Eliminar la clase "${clase.nombre}"? Se perderán también sus inscripciones.`)
    if (!confirmado) return
    await deleteClaseService(clase.id)
    onCambio()
    onClose()
  }

  if (cargando || !clase) {
    return (
      <div className="fixed top-0 right-0 h-screen w-[380px] bg-[#111111] border-l border-[#333333] p-6 z-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  const inscriptosCantidad = clase.inscripciones?.length || 0

  return (
    <div className="fixed top-0 right-0 h-screen w-[380px] bg-[#111111] border-l border-[#333333] p-6 z-50 overflow-y-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-white font-bold text-xl">{clase.nombre}</h3>
          <p className="text-gray-500 text-sm capitalize">
            {clase.diaSemana} — {clase.horaInicio} a {clase.horaFin}hs
          </p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="border-t border-[#333333] my-4"></div>

      {/* Info */}
      <div className="space-y-3 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-500">🏋️ Instructor</span>
          <span className="text-white">{clase.instructor.nombre} {clase.instructor.apellido}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">👥 Capacidad</span>
          <span className="text-white">{inscriptosCantidad}/{clase.capacidadMaxima} personas</span>
        </div>
        <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
          <div
            className={`h-full ${inscriptosCantidad >= clase.capacidadMaxima ? 'bg-red-500' : 'bg-[#AAFF00]'}`}
            style={{ width: `${Math.min(100, (inscriptosCantidad / clase.capacidadMaxima) * 100)}%` }}
          ></div>
        </div>
        {clase.descripcion && (
          <p className="text-gray-400 text-xs pt-1">{clase.descripcion}</p>
        )}
      </div>

      {/* Acciones del dueño */}
      {esDueno && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={handleEliminarClase}
            className="flex-1 flex items-center justify-center gap-1.5 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg text-xs hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> Eliminar clase
          </button>
        </div>
      )}

      <div className="border-t border-[#333333] my-4"></div>

      {/* Lista de inscriptos */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-bold text-sm">Inscriptos en esta clase</h4>
        <span className="bg-[#AAFF00]/20 text-[#AAFF00] text-xs font-bold px-2 py-0.5 rounded-full">
          {inscriptosCantidad}
        </span>
      </div>

      <div className="space-y-1 mb-5">
        {inscriptosCantidad === 0 ? (
          <p className="text-gray-500 text-sm">Todavía no hay inscriptos.</p>
        ) : (
          clase.inscripciones.map((insc) => (
            <div key={insc.id} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                  {insc.cliente.nombre.charAt(0)}{insc.cliente.apellido.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-sm">{insc.cliente.nombre} {insc.cliente.apellido}</p>
                  <span className={`text-xs ${insc.estadoMembresia === 'vencido' ? 'text-red-400' : 'text-[#AAFF00]'}`}>
                    {insc.estadoMembresia === 'vencido' ? 'Moroso' : 'Al día'}
                  </span>
                </div>
              </div>
              <button onClick={() => handleQuitar(insc.id)} className="text-gray-600 hover:text-red-400">
                <X size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Agregar cliente */}
      <div className="border-t border-[#333333] pt-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            placeholder="Agregar cliente a la clase..."
            disabled={agregando}
            className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#AAFF00]"
          />
        </div>
        {resultados.length > 0 && (
          <div className="mt-2 bg-[#0a0a0a] border border-[#333333] rounded-lg overflow-hidden">
            {resultados.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAgregar(c)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#1a1a1a] text-left"
              >
                <div className="w-6 h-6 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                  {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                </div>
                <span className="text-white text-sm">{c.nombre} {c.apellido}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal crear/editar clase ───────────────────────
function ModalClase({ clase, instructores, onClose, onGuardado }) {
  const esEdicion = Boolean(clase)
  const [form, setForm] = useState({
    nombre: clase?.nombre || '',
    descripcion: clase?.descripcion || '',
    instructorId: clase?.instructorId || (instructores[0]?.id || ''),
    diaSemana: clase?.diaSemana || 'lunes',
    horaInicio: clase?.horaInicio || '09:00',
    horaFin: clase?.horaFin || '10:00',
    capacidadMaxima: clase?.capacidadMaxima || 12
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      if (esEdicion) {
        await updateClaseService(clase.id, form)
      } else {
        await createClaseService(form)
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la clase')
    } finally {
      setGuardando(false)
    }
  }

  const estiloInput = "w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#AAFF00] transition-colors"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-[#AAFF00]/30 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">🏋️ {esEdicion ? 'Editar clase' : 'Crear nueva clase'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="border-t border-[#333333] mb-5"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1.5">Nombre de la clase *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Funcional" className={estiloInput} required />
            </div>
            <div>
              <label className="block text-white text-sm mb-1.5">Instructor *</label>
              <select name="instructorId" value={form.instructorId} onChange={handleChange} className={estiloInput} required>
                {instructores.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre} {i.apellido}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1.5">Día de la semana *</label>
              <select name="diaSemana" value={form.diaSemana} onChange={handleChange} className={estiloInput} required>
                {DIAS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm mb-1.5">Capacidad máxima *</label>
              <input type="number" name="capacidadMaxima" value={form.capacidadMaxima} onChange={handleChange} className={estiloInput} required min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1.5">Hora de inicio *</label>
              <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} className={estiloInput} required />
            </div>
            <div>
              <label className="block text-white text-sm mb-1.5">Hora de fin *</label>
              <input type="time" name="horaFin" value={form.horaFin} onChange={handleChange} className={estiloInput} required />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm mb-1.5">Descripción (opcional)</label>
            <textarea
              name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="Describí brevemente de qué se trata la clase..."
              className={`${estiloInput} h-16 resize-none`}
            />
          </div>

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
              {guardando ? 'Guardando...' : 'Guardar clase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Componente principal ───────────────────────
function Clases() {
  const [clases, setClases] = useState([])
  const [instructores, setInstructores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [claseEditando, setClaseEditando] = useState(null)

  const { usuario } = useAuth()
  const esDueno = usuario?.rol === 'dueno'

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [dataClases, dataInstructores] = await Promise.all([
        getClasesService(),
        getInstructoresService()
      ])
      setClases(dataClases)
      setInstructores(dataInstructores)
    } catch (err) {
      console.error('Error al cargar clases:', err)
    } finally {
      setCargando(false)
    }
  }

  const abrirCrear = () => { setClaseEditando(null); setMostrarModal(true) }

  const handleGuardado = () => {
    setMostrarModal(false)
    cargarDatos()
  }

  // Lista de nombres únicos de clases, para asignar colores de forma consistente
  const nombresUnicos = [...new Set(clases.map(c => c.nombre))]

  // Agrupamos las clases por día de la semana
  const clasesPorDia = DIAS.reduce((acc, dia) => {
    acc[dia.key] = clases.filter(c => c.diaSemana === dia.key)
    return acc
  }, {})

  const totalInscripciones = clases.reduce((acc, c) => acc + (c._count?.inscripciones || 0), 0)
  const instructoresActivos = new Set(clases.map(c => c.instructorId)).size

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Clases</h2>
          <p className="text-gray-500 text-sm mt-1">Horario semanal recurrente del gimnasio</p>
        </div>
        {esDueno && (
          <button onClick={abrirCrear} className="flex items-center gap-2 bg-[#AAFF00] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#99ee00] transition-colors">
            <Plus size={16} />
            Crear clase
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="flex gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 bg-[#111111] border border-[#333333] px-3 py-1.5 rounded-full text-gray-300 text-xs">
          <CalendarIcon size={13} className="text-[#AAFF00]" /> {clases.length} clases por semana
        </span>
        <span className="flex items-center gap-1.5 bg-[#111111] border border-[#333333] px-3 py-1.5 rounded-full text-gray-300 text-xs">
          <Users size={13} className="text-[#AAFF00]" /> {totalInscripciones} inscripciones activas
        </span>
        <span className="flex items-center gap-1.5 bg-[#111111] border border-[#333333] px-3 py-1.5 rounded-full text-gray-300 text-xs">
          <Clock size={13} className="text-[#AAFF00]" /> {instructoresActivos} instructores activos
        </span>
      </div>

      {/* Grilla semanal */}
      {cargando ? (
        <div className="py-16 text-center text-gray-500">Cargando clases...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {DIAS.map((dia) => (
            <div key={dia.key} className="bg-[#111111] border border-[#333333] rounded-xl p-3 min-h-[200px]">
              <p className="text-gray-400 text-xs uppercase font-semibold mb-3 text-center border-b border-[#333333] pb-2">
                {dia.label}
              </p>
              {clasesPorDia[dia.key].length === 0 ? (
                <p className="text-gray-600 text-xs text-center mt-4">Sin clases</p>
              ) : (
                clasesPorDia[dia.key].map((clase) => (
                  <ClaseCard
                    key={clase.id}
                    clase={clase}
                    color={getColorClase(clase.nombre, nombresUnicos)}
                    onClick={() => setClaseSeleccionadaId(clase.id)}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panel lateral */}
      {claseSeleccionadaId && (
        <PanelDetalleClase
          claseId={claseSeleccionadaId}
          onClose={() => setClaseSeleccionadaId(null)}
          onCambio={cargarDatos}
          esDueno={esDueno}
        />
      )}

      {/* Modal crear/editar */}
      {mostrarModal && (
        <ModalClase
          clase={claseEditando}
          instructores={instructores}
          onClose={() => setMostrarModal(false)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  )
}

export default Clases