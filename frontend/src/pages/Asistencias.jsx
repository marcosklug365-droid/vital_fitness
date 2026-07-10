import { useState, useEffect } from 'react'
import { useAforo } from '../hooks/useAforo'
import {
  registrarEntradaService,
  registrarSalidaService,
  getHistorialHoyService
} from '../services/asistenciasService'
import { getClientesService } from '../services/clientesService'
import {
  Search, LogIn, LogOut, Clock, AlertTriangle, CheckCircle2, User
} from 'lucide-react'

function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// Calcula cuántos minutos lleva un cliente adentro
function minutosDentro(fechaEntrada) {
  return Math.floor((new Date() - new Date(fechaEntrada)) / 60000)
}

function Asistencias() {
  const { aforo, cargando, recargar } = useAforo()

  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [registrando, setRegistrando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(null)
  const [historial, setHistorial] = useState([])

  useEffect(() => { cargarHistorial() }, [])

  // Recargamos el historial cada vez que cambia el aforo (alguien entró o salió)
  useEffect(() => { cargarHistorial() }, [aforo.ocupados])

  const cargarHistorial = async () => {
    try {
      const data = await getHistorialHoyService()
      setHistorial(data)
    } catch (err) {
      console.error('Error al cargar historial:', err)
    }
  }

  // Buscador de clientes con debounce (mismo patrón usado en Pagos y Clases)
  useEffect(() => {
    if (!busqueda || clienteEncontrado) { setResultados([]); return }
    const timer = setTimeout(async () => {
      const data = await getClientesService('', busqueda)
      setResultados(data.slice(0, 5))
    }, 350)
    return () => clearTimeout(timer)
  }, [busqueda])

  const seleccionarCliente = (cliente) => {
    setClienteEncontrado(cliente)
    setBusqueda(`${cliente.nombre} ${cliente.apellido}`)
    setResultados([])
  }

  const handleConfirmarEntrada = async () => {
    if (!clienteEncontrado) return
    setRegistrando(true)
    try {
      await registrarEntradaService(clienteEncontrado.id)
      setMensajeExito(`${clienteEncontrado.nombre} ${clienteEncontrado.apellido} — ${formatearHora(new Date())}`)
      setClienteEncontrado(null)
      setBusqueda('')
      // El aforo se actualiza solo gracias al evento de Socket.io,
      // no necesitamos llamar a recargar() manualmente
      setTimeout(() => setMensajeExito(null), 2500)
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo registrar la entrada')
    } finally {
      setRegistrando(false)
    }
  }

  const handleRegistrarSalida = async (asistenciaId) => {
    try {
      await registrarSalidaService(asistenciaId)
      // Igual que con la entrada: el socket avisa solo, no hace falta recargar manualmente
    } catch (err) {
      alert('No se pudo registrar la salida')
    }
  }

  const porcentajeOcupado = (aforo.ocupados / aforo.capacidadMaxima) * 100
  let estadoAforo = { texto: 'HAY LUGAR', color: 'bg-[#AAFF00] text-black' }
  if (porcentajeOcupado >= 100) estadoAforo = { texto: 'LLENO', color: 'bg-red-500 text-white' }
  else if (porcentajeOcupado >= 75) estadoAforo = { texto: 'CASI LLENO', color: 'bg-yellow-500 text-black' }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Asistencias y Aforo</h2>
          <p className="text-gray-500 text-sm mt-1">Registrá entradas y salidas en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#AAFF00] animate-pulse"></span>
          <span className="text-[#AAFF00] text-sm font-bold">En vivo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Aforo en tiempo real ─── */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 flex flex-col items-center text-center">
          <p className="text-gray-500 text-sm mb-2">Aforo actual</p>
          <p className="text-white font-bold text-6xl">{cargando ? '—' : aforo.ocupados}</p>
          <p className="text-gray-500 text-sm mb-4">de {aforo.capacidadMaxima} lugares</p>

          {/* Círculo de progreso simple con borde */}
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#1a1a1a" strokeWidth="10" fill="none" />
              <circle
                cx="64" cy="64" r="56"
                stroke={porcentajeOcupado >= 100 ? '#FF4444' : porcentajeOcupado >= 75 ? '#FFB800' : '#AAFF00'}
                strokeWidth="10" fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(porcentajeOcupado, 100) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{Math.round(porcentajeOcupado)}%</span>
            </div>
          </div>

          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${estadoAforo.color}`}>
            {estadoAforo.texto}
          </span>

          <div className="border-t border-[#333333] w-full my-4"></div>

          <div className="w-full space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#AAFF00]">🟢 Disponibles</span>
              <span className="text-white">{Math.max(0, aforo.capacidadMaxima - aforo.ocupados)} lugares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">👥 Ocupados</span>
              <span className="text-white">{aforo.ocupados} personas</span>
            </div>
          </div>
        </div>

        {/* ─── Registrar entrada ─── */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
          <h3 className="text-white font-bold text-base mb-4">🚪 Registrar entrada</h3>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setClienteEncontrado(null) }}
              placeholder="Buscá por nombre o DNI..."
              className="w-full bg-[#0a0a0a] border border-[#AAFF00]/40 rounded-lg pl-9 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#AAFF00]"
            />
          </div>

          {/* Resultados de búsqueda */}
          {resultados.length > 0 && (
            <div className="mt-2 bg-[#0a0a0a] border border-[#AAFF00]/30 rounded-lg overflow-hidden">
              {resultados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => seleccionarCliente(c)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                      {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm">{c.nombre} {c.apellido}</p>
                      <p className="text-gray-500 text-xs">DNI: {c.dni}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    c.estado === 'vencido' ? 'bg-red-500/20 text-red-400' : 'bg-[#AAFF00]/20 text-[#AAFF00]'
                  }`}>
                    {c.estado === 'vencido' ? 'Vencida' : 'Al día'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Cliente seleccionado */}
          {clienteEncontrado && (
            <div className="mt-4 bg-[#0a0a0a] border-2 border-[#AAFF00] rounded-lg p-4">
              <p className="text-[#AAFF00] text-xs font-semibold mb-2">✓ Cliente encontrado</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                  {clienteEncontrado.nombre.charAt(0)}{clienteEncontrado.apellido.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold">{clienteEncontrado.nombre} {clienteEncontrado.apellido}</p>
                  <span className={`text-xs font-semibold ${
                    clienteEncontrado.estado === 'vencido' ? 'text-red-400' : 'text-[#AAFF00]'
                  }`}>
                    {clienteEncontrado.estado === 'vencido' ? '❌ Membresía vencida' : '✅ Membresía al día'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmarEntrada}
                disabled={registrando}
                className={`w-full mt-4 flex items-center justify-center gap-2 font-bold py-3 rounded-lg text-sm uppercase transition-colors disabled:opacity-50 ${
                  clienteEncontrado.estado === 'vencido'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#AAFF00] text-black hover:bg-[#99ee00]'
                }`}
              >
                <LogIn size={16} />
                {registrando ? 'Registrando...' :
                  clienteEncontrado.estado === 'vencido' ? 'Membresía vencida — Registrar igual' : 'Confirmar entrada'}
              </button>
            </div>
          )}

          {/* Mensaje de éxito */}
          {mensajeExito && (
            <div className="mt-4 bg-[#AAFF00]/10 border border-[#AAFF00] rounded-lg p-4 text-center">
              <CheckCircle2 size={28} className="text-[#AAFF00] mx-auto mb-1" />
              <p className="text-white font-bold">¡Entrada registrada!</p>
              <p className="text-gray-400 text-sm">{mensajeExito}</p>
            </div>
          )}
        </div>

        {/* ─── Clientes dentro del gimnasio ─── */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base">👥 En el gimnasio ahora</h3>
            <span className="bg-[#AAFF00]/20 text-[#AAFF00] text-xs font-bold px-2 py-0.5 rounded-full">
              {aforo.clientesDentro?.length || 0}
            </span>
          </div>

          <div className="space-y-1 max-h-[340px] overflow-y-auto">
            {!aforo.clientesDentro || aforo.clientesDentro.length === 0 ? (
              <div className="py-10 text-center">
                <User size={32} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">El gimnasio está vacío</p>
              </div>
            ) : (
              aforo.clientesDentro.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                      {a.cliente.nombre.charAt(0)}{a.cliente.apellido.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm">{a.cliente.nombre} {a.cliente.apellido}</p>
                      <p className="text-gray-500 text-xs">
                        Ingresó a las {formatearHora(a.fechaEntrada)} · {minutosDentro(a.fechaEntrada)} min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRegistrarSalida(a.id)}
                    className="border border-red-500/40 text-red-400 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-500/10 transition-colors flex items-center gap-1"
                  >
                    <LogOut size={12} /> Salida
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Historial de hoy ─── */}
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
        <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#AAFF00]" />
          Historial de hoy
        </h3>

        {historial.length === 0 ? (
          <p className="text-gray-500 text-sm">Todavía no hubo movimientos hoy.</p>
        ) : (
          <div className="space-y-1">
            {historial.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0 text-sm">
                <span className="bg-[#0a0a0a] px-2 py-1 rounded-md text-gray-400 text-xs w-16 text-center">
                  {formatearHora(a.fechaEntrada)}
                </span>
                <span className="text-white flex-1 ml-3">{a.cliente.nombre} {a.cliente.apellido}</span>
                <span className={`text-xs ${a.fechaSalida ? 'text-gray-500' : 'text-[#AAFF00]'}`}>
                  {a.fechaSalida ? `Salió a las ${formatearHora(a.fechaSalida)}` : 'Todavía adentro'}
                </span>
                <span className="text-gray-600 text-xs ml-3">por {a.registrador.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Asistencias