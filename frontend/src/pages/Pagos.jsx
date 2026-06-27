import { useState, useEffect } from 'react'
import {
  getPagosService,
  getResumenPagosService,
  createPagoService
} from '../services/pagosService'
import { getClientesService } from '../services/clientesService'
import {
  Plus, X, Save, Search, DollarSign,
  Wallet, CreditCard, AlertTriangle
} from 'lucide-react'

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(monto || 0)
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Iconos y etiquetas según el medio de pago
const medioPagoInfo = {
  efectivo:          { icono: Wallet,     label: 'Efectivo' },
  transferencia:     { icono: CreditCard, label: 'Transferencia' },
  tarjeta_de_debito: { icono: CreditCard, label: 'Tarjeta de Débito' },
}

// ─── Modal de registrar pago ───────────────────────
function ModalRegistrarPago({ onClose, onGuardado }) {
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [resultados, setResultados] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [buscando, setBuscando] = useState(false)

  const [monto, setMonto] = useState('')
  const [medioPago, setMedioPago] = useState('efectivo')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])
  const [observaciones, setObservaciones] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Buscamos clientes a medida que el usuario escribe (con un pequeño debounce manual)
  useEffect(() => {
    if (!busquedaCliente || clienteSeleccionado) {
      setResultados([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setBuscando(true)
        const data = await getClientesService('', busquedaCliente)
        setResultados(data.slice(0, 5)) // mostramos máximo 5 resultados
      } catch (err) {
        console.error('Error al buscar clientes:', err)
      } finally {
        setBuscando(false)
      }
    }, 350) // espera 350ms después de la última tecla antes de buscar

    return () => clearTimeout(timer) // cancela la búsqueda anterior si el usuario sigue escribiendo
  }, [busquedaCliente])

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCliente(`${cliente.nombre} ${cliente.apellido}`)
    setResultados([])
    // Si el cliente tiene un plan activo, sugerimos ese monto automáticamente
    if (cliente.membresia?.plan?.precio) {
      setMonto(cliente.membresia.plan.precio)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!clienteSeleccionado) {
      setError('Tenés que seleccionar un cliente de la lista')
      return
    }

    setGuardando(true)
    try {
      await createPagoService({
        clienteId: clienteSeleccionado.id,
        monto: parseFloat(monto),
        medioPago,
        fechaPago,
        observaciones
      })
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el pago')
    } finally {
      setGuardando(false)
    }
  }

  const estiloInput = "w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#AAFF00] transition-colors"

  const medios = [
    { key: 'efectivo',          icono: Wallet,     label: 'Efectivo' },
    { key: 'transferencia',     icono: CreditCard, label: 'Transferencia' },
    { key: 'tarjeta_de_debito', icono: CreditCard, label: 'Tarjeta de Débito' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-[#AAFF00]/30 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">💰 Registrar pago</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="border-t border-[#333333] mb-5"></div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Buscador de cliente */}
          <div className="relative">
            <label className="block text-white text-sm mb-1.5">Cliente *</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                placeholder="Buscá al cliente por nombre o DNI..."
                className={`${estiloInput} pl-9`}
              />
            </div>

            {/* Resultados de búsqueda */}
            {resultados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#0a0a0a] border border-[#AAFF00]/30 rounded-lg overflow-hidden">
                {resultados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => seleccionarCliente(c)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                      {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm">{c.nombre} {c.apellido}</p>
                      <p className="text-gray-500 text-xs">DNI: {c.dni}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {buscando && <p className="text-gray-500 text-xs mt-1">Buscando...</p>}
          </div>

          {/* Card del cliente seleccionado */}
          {clienteSeleccionado && (
            <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs">
                  {clienteSeleccionado.nombre.charAt(0)}{clienteSeleccionado.apellido.charAt(0)}
                </div>
                <p className="text-white text-sm font-medium">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>
              </div>
              <span className="text-gray-500 text-xs">
                Plan: {clienteSeleccionado.membresia?.plan?.nombre || 'Sin plan'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1.5">Monto *</label>
              <input
                type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 8000" className={estiloInput} required
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1.5">Fecha de pago *</label>
              <input
                type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)}
                className={estiloInput} required
              />
            </div>
          </div>

          {/* Selector visual de medio de pago */}
          <div>
            <label className="block text-white text-sm mb-1.5">Medio de pago *</label>
            <div className="grid grid-cols-3 gap-2">
              {medios.map((m) => {
                const Icono = m.icono
                const seleccionado = medioPago === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMedioPago(m.key)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-colors ${
                      seleccionado
                        ? 'border-[#AAFF00] bg-[#AAFF00]/10 text-[#AAFF00]'
                        : 'border-[#333333] bg-[#0a0a0a] text-gray-500'
                    }`}
                  >
                    <Icono size={18} />
                    <span className="text-xs">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-white text-sm mb-1.5">Observaciones (opcional)</label>
            <textarea
              value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Pago parcial, descuento aplicado..."
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
              {guardando ? 'Guardando...' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Pagos() {
  const [pagos, setPagos] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [medioPagoFiltro, setMedioPagoFiltro] = useState('todos')
  const [mostrarModal, setMostrarModal] = useState(false)

  useEffect(() => { cargarDatos() }, [periodo, medioPagoFiltro])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [dataPagos, dataResumen] = await Promise.all([
        getPagosService({ periodo, medioPago: medioPagoFiltro }),
        getResumenPagosService()
      ])
      setPagos(dataPagos)
      setResumen(dataResumen)
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    } finally {
      setCargando(false)
    }
  }

  const handleGuardado = () => {
    setMostrarModal(false)
    cargarDatos()
  }

  const periodos = [
    { key: 'hoy',    label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mes' },
    { key: 'anio',   label: 'Año' },
  ]

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Pagos e ingresos</h2>
          <p className="text-gray-500 text-sm mt-1">Registros de cobros y resumen financiero</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-[#AAFF00] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#99ee00] transition-colors"
        >
          <Plus size={16} />
          Registrar pago
        </button>
      </div>

      {/* Tarjetas de resumen */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Hoy</p>
            <p className="text-[#AAFF00] font-bold text-2xl">{formatearMonto(resumen.hoy.total)}</p>
            <p className="text-gray-500 text-xs mt-1">{resumen.hoy.cantidadPagos} pagos registrados</p>
          </div>
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Esta semana</p>
            <p className="text-white font-bold text-2xl">{formatearMonto(resumen.semana.total)}</p>
          </div>
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Este mes</p>
            <p className="text-white font-bold text-2xl">{formatearMonto(resumen.mes.total)}</p>
            {resumen.mes.variacionPorcentual !== null && (
              <p className={`text-xs mt-1 ${resumen.mes.variacionPorcentual >= 0 ? 'text-[#AAFF00]' : 'text-red-400'}`}>
                {resumen.mes.variacionPorcentual >= 0 ? '↑' : '↓'} {Math.abs(resumen.mes.variacionPorcentual)}% vs mes anterior
              </p>
            )}
          </div>
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-5 relative">
            <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Morosos</p>
            <p className="text-red-400 font-bold text-2xl">{resumen.morosos.cantidad}</p>
            <p className="text-red-400 text-xs mt-1">{formatearMonto(resumen.morosos.totalAdeudado)} sin cobrar</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tabla de pagos */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#333333] rounded-xl overflow-hidden">

          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#333333]">
            <h3 className="text-white font-bold text-base">Historial de pagos</h3>
            <div className="flex gap-2">
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    periodo === p.key ? 'bg-[#AAFF00] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#0a0a0a] border-b border-[#333333]">
            <span className="col-span-4 text-gray-500 text-xs uppercase font-semibold">Cliente</span>
            <span className="col-span-2 text-gray-500 text-xs uppercase font-semibold">Monto</span>
            <span className="col-span-3 text-gray-500 text-xs uppercase font-semibold">Medio</span>
            <span className="col-span-3 text-gray-500 text-xs uppercase font-semibold">Fecha</span>
          </div>

          {cargando ? (
            <div className="py-12 text-center text-gray-500">Cargando pagos...</div>
          ) : pagos.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No hay pagos registrados en este período</div>
          ) : (
            pagos.map((pago) => {
              const info = medioPagoInfo[pago.medioPago] || medioPagoInfo.efectivo
              const Icono = info.icono
              return (
                <div key={pago.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a] transition-colors">
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                      {pago.cliente.nombre.charAt(0)}{pago.cliente.apellido.charAt(0)}
                    </div>
                    <p className="text-white text-sm truncate">{pago.cliente.nombre} {pago.cliente.apellido}</p>
                  </div>
                  <div className="col-span-2 flex items-center text-[#AAFF00] font-semibold text-sm">
                    {formatearMonto(pago.monto)}
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 bg-[#0a0a0a] px-2 py-1 rounded-md text-gray-300 text-xs">
                      <Icono size={11} /> {info.label}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center text-gray-400 text-sm">
                    {formatearFecha(pago.fechaPago)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">

          {/* Breakdown por medio de pago */}
          {resumen && (
            <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
              <h3 className="text-white font-bold text-sm mb-4">Ingresos por medio de pago (mes)</h3>
              <div className="space-y-3">
                {resumen.porMedioPago.length === 0 ? (
                  <p className="text-gray-500 text-sm">Sin datos este mes</p>
                ) : (
                  resumen.porMedioPago.map((item) => {
                    const info = medioPagoInfo[item.medioPago] || medioPagoInfo.efectivo
                    const totalGeneral = resumen.porMedioPago.reduce((acc, i) => acc + i.total, 0)
                    const porcentaje = totalGeneral > 0 ? Math.round((item.total / totalGeneral) * 100) : 0
                    return (
                      <div key={item.medioPago}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{info.label}</span>
                          <span className="text-white">{formatearMonto(item.total)} — {porcentaje}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#AAFF00]" style={{ width: `${porcentaje}%` }}></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Clientes morosos */}
          {resumen && resumen.morosos.cantidad > 0 && (
            <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-white font-bold text-sm">Clientes morosos</h3>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                  {resumen.morosos.cantidad}
                </span>
              </div>
              <div className="space-y-3">
                {resumen.morosos.clientes.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">
                        {m.cliente.nombre.charAt(0)}{m.cliente.apellido.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{m.cliente.nombre} {m.cliente.apellido}</p>
                        <p className="text-red-400 text-xs">Vencido hace {m.diasVencido} días</p>
                      </div>
                    </div>
                    <span className="text-red-400 font-semibold text-xs">{formatearMonto(m.monto)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#333333] mt-4 pt-3 text-right">
                <span className="text-red-400 font-bold text-sm">
                  Total sin cobrar: {formatearMonto(resumen.morosos.totalAdeudado)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {mostrarModal && (
        <ModalRegistrarPago
          onClose={() => setMostrarModal(false)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  )
}

export default Pagos