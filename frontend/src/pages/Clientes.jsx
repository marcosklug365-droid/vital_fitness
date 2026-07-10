import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getClientesService, deleteClienteService } from '../services/clientesService'
import { Search, Plus, Eye, Pencil, Trash2, User } from 'lucide-react'

// Componente de badge de estado
function BadgeEstado({ estado }) {
  const estilos = {
    activo:       'bg-[#AAFF00]/20 text-[#AAFF00]',
    por_vencer:   'bg-yellow-500/20 text-yellow-400',
    vencido:      'bg-red-500/20 text-red-400',
    sin_membresia: 'bg-gray-500/20 text-gray-400',
  }
  const etiquetas = {
    activo:       'Al día',
    por_vencer:   'Por vencer',
    vencido:      'Moroso',
    sin_membresia: 'Sin plan',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estilos[estado] || estilos.sin_membresia}`}>
      {etiquetas[estado] || 'Sin plan'}
    </span>
  )
}

// Componente de avatar con iniciales
function Avatar({ nombre, apellido }) {
  const iniciales = `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`
  return (
    <div className="w-9 h-9 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
      {iniciales}
    </div>
  )
}

// Función para formatear fechas
function formatearFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const [eliminando, setEliminando] = useState(null)

  const { usuario } = useAuth()
  const navigate = useNavigate()
  const esDueno = usuario?.rol === 'dueno'

  // Cargamos los clientes cuando cambia el filtro o la búsqueda
  useEffect(() => {
    cargarClientes()
  }, [filtroActivo])

  const cargarClientes = async () => {
    try {
      setCargando(true)
      const data = await getClientesService(filtroActivo, busqueda)
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setCargando(false)
    }
  }

  // Buscamos cuando el usuario presiona Enter o deja de escribir
  const handleBusqueda = (e) => {
    if (e.key === 'Enter') cargarClientes()
  }

  const handleEliminar = async (id, nombre, apellido) => {
    const confirmado = window.confirm(
      `¿Estás seguro de que querés eliminar a ${nombre} ${apellido}? Esta acción no se puede deshacer.`
    )
    if (!confirmado) return

    try {
      setEliminando(id)
      await deleteClienteService(id)
      setClientes(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      alert('No se pudo eliminar el cliente.')
    } finally {
      setEliminando(null)
    }
  }

  const filtros = [
    { key: '',          label: 'Todos' },
    { key: 'activos',   label: 'Activos' },
    { key: 'morosos',   label: 'Morosos' },
    { key: 'por_vencer', label: 'Por vencer' },
    { key: 'inactivos', label: 'Inactivos' },
  ]

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Clientes</h2>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes encontrados</p>
        </div>
        {esDueno && (
          <button
            onClick={() => navigate('/inscripcion')}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(170,255,0,0.2)]"
          >
            <Plus size={16} />
            Nueva Inscripción
          </button>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-4 flex flex-col sm:flex-row gap-4">

        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleBusqueda}
            placeholder="Buscar por nombre, apellido o DNI... (Enter para buscar)"
            className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#AAFF00] transition-colors"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroActivo(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroActivo === f.key
                  ? 'bg-[#AAFF00] text-black'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#111111] border border-[#333333] rounded-xl overflow-hidden">

        {/* Header de la tabla */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#0a0a0a] border-b border-[#333333]">
          <span className="col-span-4 text-gray-500 text-xs uppercase font-semibold">Cliente</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">DNI</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">Plan</span>
          <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">Vencimiento</span>
          <span className="col-span-1 text-gray-500 text-xs uppercase font-semibold">Estado</span>
          <span className="col-span-1 text-gray-500 text-xs uppercase font-semibold text-right">Acciones</span>
        </div>

        {/* Filas */}
        {cargando ? (
          <div className="py-16 text-center text-gray-500">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          // Estado vacío
          <div className="py-16 flex flex-col items-center gap-3">
            <User size={48} className="text-gray-700" />
            <p className="text-white font-medium">No se encontraron clientes</p>
            <p className="text-gray-500 text-sm">Intentá con otro nombre o ajustá los filtros</p>
            {esDueno && (
              <button
                onClick={() => navigate('/clientes/nuevo')}
                className="mt-2 bg-[#AAFF00] text-black font-bold px-4 py-2 rounded-lg text-sm"
              >
                Agregar el primer cliente
              </button>
            )}
          </div>
        ) : (
          clientes.map((cliente) => (
            <div
              key={cliente.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors ${
                cliente.estado === 'vencido' ? 'border-l-2 border-l-red-500' :
                cliente.estado === 'por_vencer' ? 'border-l-2 border-l-yellow-500' : ''
              }`}
            >
              {/* Nombre */}
              <div className="col-span-4 flex items-center gap-3">
                <Avatar nombre={cliente.nombre} apellido={cliente.apellido} />
                <div>
                  <p className="text-white font-medium text-sm">
                    {cliente.nombre} {cliente.apellido}
                  </p>
                  <p className="text-gray-500 text-xs">{cliente.email || '—'}</p>
                </div>
              </div>

              {/* DNI */}
              <div className="col-span-2 flex items-center">
                <span className="text-gray-300 text-sm">{cliente.dni}</span>
              </div>

              {/* Plan */}
              <div className="col-span-2 flex items-center">
                <span className="text-gray-300 text-sm">
                  {cliente.membresia?.plan?.nombre || '—'}
                </span>
              </div>

              {/* Vencimiento */}
              <div className="col-span-2 flex items-center">
                <span className={`text-sm ${
                  cliente.estado === 'vencido' ? 'text-red-400' :
                  cliente.estado === 'por_vencer' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  {formatearFecha(cliente.membresia?.fechaVencimiento)}
                </span>
              </div>

              {/* Estado */}
              <div className="col-span-1 flex items-center">
                <BadgeEstado estado={cliente.estado} />
              </div>

              {/* Acciones */}
              <div className="col-span-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#AAFF00] transition-colors"
                  title="Ver ficha"
                >
                  <Eye size={14} />
                </button>

                {esDueno && (
                  <>
                    <button
                      onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#AAFF00] transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleEliminar(cliente.id, cliente.nombre, cliente.apellido)}
                      disabled={eliminando === cliente.id}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Clientes