import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  Clock,
  Unlock,
  KeyRound
} from 'lucide-react'
import { forzarEntradaService } from '../services/asistenciasService'
import { getClienteByIdService, generarCredencialesWebService } from '../services/clientesService'

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

  // Modal Forzar Ingreso
  const [mostrarModalForzar, setMostrarModalForzar] = useState(false)
  const [motivoForzar, setMotivoForzar] = useState('')
  const [forzando, setForzando] = useState(false)
  const [errorForzar, setErrorForzar] = useState('')
  const [exitoForzar, setExitoForzar] = useState('')

  // Modal Generar Credenciales
  const [mostrarModalCredenciales, setMostrarModalCredenciales] = useState(false)
  const [generandoCredenciales, setGenerandoCredenciales] = useState(false)
  const [passwordTemporal, setPasswordTemporal] = useState('')
  const [errorCredenciales, setErrorCredenciales] = useState('')

  const cargarCliente = async () => {
    try {
      setCargando(true)
      const data = await getClienteByIdService(id)
      setCliente(data)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la información del cliente')
    } finally {
      setCargando(false)
    }
  }

  const handleGenerarCredenciales = async () => {
    try {
      setGenerandoCredenciales(true)
      setErrorCredenciales('')
      const res = await generarCredencialesWebService(cliente.id)
      setPasswordTemporal(res.passwordTemporal)
      cargarCliente() // Refresca para mostrar que ya tiene acceso habilitado
    } catch (err) {
      setErrorCredenciales(err.response?.data?.error || 'Error al generar credenciales')
    } finally {
      setGenerandoCredenciales(false)
    }
  }

  const handleForzarIngreso = async (e) => {
    e.preventDefault()
    if (!motivoForzar.trim()) return

    try {
      setForzando(true)
      setErrorForzar('')
      await forzarEntradaService(cliente.id, motivoForzar)
      setExitoForzar('Ingreso forzado registrado correctamente.')
      setTimeout(() => {
        setMostrarModalForzar(false)
        setMotivoForzar('')
        setExitoForzar('')
        cargarCliente() // Recargar para actualizar asistencia
      }, 2000)
    } catch (err) {
      setErrorForzar(err.response?.data?.error || 'Error al forzar ingreso')
    } finally {
      setForzando(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCliente()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

        <div className="flex gap-2">
          {esDueno && (
            <button
              onClick={() => setMostrarModalCredenciales(true)}
              className="flex items-center gap-2 border border-[#AAFF00]/50 text-[#AAFF00] px-4 py-2 rounded-lg hover:bg-[#AAFF00]/10 transition-colors text-sm"
            >
              <KeyRound size={14} />
              {cliente.accesoWebEnabled ? 'Restablecer Acceso' : 'Generar Acceso'}
            </button>
          )}

          <button
            onClick={() => setMostrarModalForzar(true)}
            className="flex items-center gap-2 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
          >
            <Unlock size={14} />
            Forzar Ingreso
          </button>
          
          {esDueno && (
            <button
              onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
              className="flex items-center gap-2 border border-[#333333] text-white px-4 py-2 rounded-lg hover:border-[#AAFF00] transition-colors text-sm"
            >
              <Pencil size={14} />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* MODAL FORZAR INGRESO */}
      {mostrarModalForzar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111111] border border-red-500/30 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#333333]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Unlock className="text-red-400" /> Forzar Ingreso
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Vas a autorizar el ingreso manual de {cliente.nombre}. Esto quedará registrado en la auditoría.
              </p>
            </div>
            <form onSubmit={handleForzarIngreso} className="p-6 space-y-4">
              {errorForzar && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
                  {errorForzar}
                </div>
              )}
              {exitoForzar && (
                <div className="bg-[#AAFF00]/10 border border-[#AAFF00]/50 text-[#AAFF00] text-sm p-3 rounded-lg">
                  {exitoForzar}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Motivo de autorización</label>
                <textarea
                  value={motivoForzar}
                  onChange={(e) => setMotivoForzar(e.target.value)}
                  placeholder="Ej: Se olvidó la billetera, paga mañana..."
                  className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-400 h-24 resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalForzar(false)}
                  className="flex-1 bg-[#1a1a1a] text-white border border-[#333333] py-3 rounded-lg font-bold hover:bg-[#222222] transition-colors"
                  disabled={forzando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forzando || !motivoForzar.trim()}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {forzando ? 'Procesando...' : 'Autorizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GENERAR CREDENCIALES */}
      {mostrarModalCredenciales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111111] border border-[#AAFF00]/30 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#333333]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <KeyRound className="text-[#AAFF00]" /> {cliente.accesoWebEnabled ? 'Restablecer Acceso Web' : 'Generar Acceso Web'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Esto generará una nueva contraseña temporal para que {cliente.nombre} pueda iniciar sesión en el portal de clientes.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {errorCredenciales && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
                  {errorCredenciales}
                </div>
              )}
              
              {passwordTemporal ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-300 text-sm">Entregale estos datos al cliente:</p>
                  <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-lg inline-block text-left w-full">
                    <p className="text-gray-400 text-xs mb-1">Usuario (DNI):</p>
                    <p className="text-white font-mono text-lg mb-3">{cliente.dni}</p>
                    <p className="text-gray-400 text-xs mb-1">Contraseña Temporal:</p>
                    <p className="text-[#AAFF00] font-mono text-2xl font-bold tracking-widest">{passwordTemporal}</p>
                  </div>
                  <p className="text-yellow-500 text-xs font-semibold">
                    Atención: Esta contraseña solo se mostrará una vez. Al ingresar, el sistema le obligará a cambiarla.
                  </p>
                  <button
                    onClick={() => {
                      setMostrarModalCredenciales(false)
                      setPasswordTemporal('')
                    }}
                    className="w-full bg-[#AAFF00] text-black py-3 rounded-lg font-bold hover:bg-[#99e600] transition-colors"
                  >
                    Aceptar
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setMostrarModalCredenciales(false)}
                    className="flex-1 bg-[#1a1a1a] text-white border border-[#333333] py-3 rounded-lg font-bold hover:bg-[#222222] transition-colors"
                    disabled={generandoCredenciales}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerarCredenciales}
                    disabled={generandoCredenciales}
                    className="flex-1 bg-[#AAFF00] text-black py-3 rounded-lg font-bold hover:bg-[#99e600] transition-colors disabled:opacity-50"
                  >
                    {generandoCredenciales ? 'Generando...' : 'Generar Credenciales'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                🎫 Membresía {membresiaActiva ? 'activa' : ''}
              </h3>
              {(cliente.estado === 'vencido' || cliente.estado === 'por_vencer' || cliente.estado === 'sin_membresia') && (
                <button
                  onClick={() => navigate(`/inscripcion?dni=${cliente.dni}`)}
                  className="bg-[#AAFF00] text-black font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[#99ee00] transition-colors"
                >
                  Renovar Membresía
                </button>
              )}
            </div>

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

          {/* Historial de membresías */}
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#AAFF00]" />
              Historial de membresías
            </h3>

            {cliente.membresias?.length > 1 ? (
              <div className="space-y-1">
                {cliente.membresias.slice(1, 6).map((mem) => (
                  <div
                    key={mem.id}
                    className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0"
                  >
                    <div>
                      <span className="text-[#AAFF00] font-semibold text-sm block">
                        {mem.plan?.nombre}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatearFecha(mem.fechaInicio)} — {formatearFecha(mem.fechaVencimiento)}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md capitalize font-semibold ${
                      mem.estado === 'vencida' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {mem.estado}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay membresías anteriores registradas.</p>
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