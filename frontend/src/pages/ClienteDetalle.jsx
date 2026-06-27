import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getClienteByIdService } from '../services/clientesService'
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertCircle,
  CreditCard,
  DollarSign,
  Clock
} from 'lucide-react'

// ─── Helpers de formato ───────────────────────────────
function formatearFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function formatearHora(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit'
  })
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(monto)
}

// Calcula cuánto tiempo estuvo un cliente en el gimnasio
function calcularDuracion(entrada, salida) {
  if (!salida) return 'En curso'
  const minutos = Math.round((new Date(salida) - new Date(entrada)) / 60000)
  const horas = Math.floor(minutos / 60)
  const min = minutos % 60
  return horas > 0 ? `${horas}h ${min}min` : `${min}min`
}

// ─── Badge de estado ───────────────────────────────
function BadgeEstado({ estado }) {
  const estilos = {
    activo:        'bg-[#AAFF00]/20 text-[#AAFF00]',
    por_vencer:    'bg-yellow-500/20 text-yellow-400',
    vencido:       'bg-red-500/20 text-red-400',
    sin_membresia: 'bg-gray-500/20 text-gray-400',
  }
  const etiquetas = {
    activo:        '✅ Al día',
    por_vencer:    '🟡 Por vencer',
    vencido:       '🔴 Vencida',
    sin_membresia: 'Sin membresía',
  }
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${estilos[estado] || estilos.sin_membresia}`}>
      {etiquetas[estado] || 'Sin membresía'}
    </span>
  )
}

function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esDueno = usuario?.rol === 'dueno'

  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarCliente()
  }, [id])

  const cargarCliente = async () => {
    try {
      setCargando(true)
      const data = await getClienteByIdService(id)
      setCliente(data)
    } catch (err) {
      setError('No se pudo cargar la información del cliente')
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Cargando ficha del cliente...
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-white">{error || 'Cliente no encontrado'}</p>
        <button
          onClick={() => navigate('/clientes')}
          className="text-[#AAFF00] text-sm"
        >
          Volver a clientes
        </button>
      </div>
    )
  }

  const iniciales = `${cliente.nombre?.charAt(0) || ''}${cliente.apellido?.charAt(0) || ''}`
  const membresiaActiva = cliente.membresias?.[0]

  // Calculamos días restantes/transcurridos de la membresía
  let diasRestantes = null
  let progresoMembresia = 0
  if (membresiaActiva) {
    const hoy = new Date()
    const inicio = new Date(membresiaActiva.fechaInicio)
    const vencimiento = new Date(membresiaActiva.fechaVencimiento)
    diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    const totalDias = Math.ceil((vencimiento - inicio) / (1000 * 60 * 60 * 24))
    const diasTranscurridos = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
    progresoMembresia = Math.min(100, Math.max(0, (diasTranscurridos / totalDias) * 100))
  }

  const totalAbonado = cliente.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clientes')}
            className="w-9 h-9 rounded-lg bg-[#111111] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-white font-bold text-2xl">
              {cliente.nombre} {cliente.apellido}
            </h2>
            <p className="text-gray-500 text-sm">Socio #{String(cliente.id).padStart(4, '0')}</p>
          </div>
        </div>

        {esDueno && (
          <button
            onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
            className="flex items-center gap-2 border border-[#333333] text-white px-4 py-2 rounded-lg hover:border-[#AAFF00] transition-colors text-sm"
          >
            <Pencil size={14} />
            Editar cliente
          </button>
        )}
      </div>

      {/* Contenido en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── COLUMNA IZQUIERDA: Info del cliente ─── */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 space-y-5 lg:col-span-1">

          {/* Avatar y nombre */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-20 h-20 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-2xl">
              {iniciales}
            </div>
            <p className="text-white font-bold text-lg">{cliente.nombre} {cliente.apellido}</p>
            <BadgeEstado estado={cliente.estado} />
          </div>

          <div className="border-t border-[#333333]"></div>

          {/* Lista de datos */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CreditCard size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">DNI</p>
                <p className="text-white">{cliente.dni}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">Teléfono</p>
                <p className="text-white">{cliente.telefono || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="text-white">{cliente.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">Fecha de nacimiento</p>
                <p className="text-white">{formatearFecha(cliente.fechaNacimiento)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">Dirección</p>
                <p className="text-white">{cliente.direccion || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">Contacto de emergencia</p>
                <p className="text-white">{cliente.contactoDeEmergencia || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={14} className="text-[#AAFF00] mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs">Socio desde</p>
                <p className="text-white">{formatearFecha(cliente.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── COLUMNA DERECHA: Membresía + Pagos + Asistencias ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Membresía activa */}
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              🎫 Membresía {membresiaActiva ? 'activa' : ''}
            </h3>

            {membresiaActiva ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="inline-block bg-[#0a0a0a] border border-[#AAFF00] text-[#AAFF00] px-3 py-1 rounded-lg text-sm font-semibold">
                      {membresiaActiva.plan?.nombre}
                    </span>
                    <p className="text-gray-500 text-xs mt-2">
                      Precio: {formatearMonto(membresiaActiva.plan?.precio)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">
                      Inicio: <span className="text-white">{formatearFecha(membresiaActiva.fechaInicio)}</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Vencimiento: <span className="text-white">{formatearFecha(membresiaActiva.fechaVencimiento)}</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Días restantes:{' '}
                      <span className={diasRestantes < 0 ? 'text-red-400' : 'text-[#AAFF00]'}>
                        {diasRestantes < 0 ? `Venció hace ${Math.abs(diasRestantes)} días` : `${diasRestantes} días`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#AAFF00] transition-all"
                    style={{ width: `${progresoMembresia}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600 text-xs">Inicio</span>
                  <span className="text-gray-600 text-xs">Vencimiento</span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Este cliente no tiene una membresía asignada.</p>
            )}
          </div>

          {/* Historial de pagos */}
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-[#AAFF00]" />
              Historial de pagos
            </h3>

            {cliente.pagos?.length > 0 ? (
              <>
                <div className="space-y-1">
                  {cliente.pagos.slice(0, 5).map((pago) => (
                    <div
                      key={pago.id}
                      className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0"
                    >
                      <span className="text-gray-300 text-sm">{formatearFecha(pago.fechaPago)}</span>
                      <span className="text-[#AAFF00] font-semibold text-sm">{formatearMonto(pago.monto)}</span>
                      <span className="text-gray-500 text-xs bg-[#0a0a0a] px-2 py-1 rounded-md capitalize">
                        {pago.medioPago.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#333333] mt-3 pt-3 text-right">
                  <span className="text-white font-bold text-sm">
                    Total abonado: {formatearMonto(totalAbonado)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Todavía no se registraron pagos.</p>
            )}
          </div>

          {/* Historial de asistencias */}
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#AAFF00]" />
              Historial de asistencias
            </h3>

            {cliente.asistencias?.length > 0 ? (
              <div className="space-y-1">
                {cliente.asistencias.slice(0, 5).map((asistencia) => (
                  <div
                    key={asistencia.id}
                    className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0 text-sm"
                  >
                    <span className="text-gray-300">{formatearFecha(asistencia.fechaEntrada)}</span>
                    <span className="text-gray-500">
                      {formatearHora(asistencia.fechaEntrada)} — {formatearHora(asistencia.fechaSalida)}
                    </span>
                    <span className="text-gray-500 text-xs bg-[#0a0a0a] px-2 py-1 rounded-md">
                      {calcularDuracion(asistencia.fechaEntrada, asistencia.fechaSalida)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Este cliente todavía no registró asistencias.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClienteDetalle