import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAforo } from '../hooks/useAforo'
import { getDashboardService } from '../services/dashboardService'
import { registrarSalidaService } from '../services/asistenciasService'
import {
  Users, AlertTriangle, CreditCard, DollarSign,
  Activity, Calendar, LogOut, LogIn, ArrowRight
} from 'lucide-react'

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(monto || 0)
}

// ─── Tarjeta de métrica reutilizable ───────────────────────
function MetricCard({ icono: Icono, valor, label, colorValor = 'text-white', extra }) {
  return (
    <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
      <div className="flex items-start justify-between mb-2">
        <Icono size={18} className="text-[#AAFF00]" />
      </div>
      <p className={`font-bold text-2xl ${colorValor}`}>{valor}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
      {extra && <p className="text-xs mt-1">{extra}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════
// VISTA DEL DUEÑO
// ═══════════════════════════════════════════════
function DashboardDueno() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { cargarDashboard() }, [])

  const cargarDashboard = async () => {
    try {
      const result = await getDashboardService()
      setData(result)
    } catch (err) {
      console.error('Error al cargar dashboard:', err)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return <div className="py-16 text-center text-gray-500">Cargando dashboard...</div>
  }

  if (!data) {
    return <div className="py-16 text-center text-red-400">No se pudo cargar la información</div>
  }

  const porcentajeAforo = (data.personasDentro / data.capacidadMaxima) * 100

  return (
    <div className="space-y-6">

      {/* Encabezado y Acciones Rápidas */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-2xl">Panel de Control</h2>
        <button
          onClick={() => navigate('/inscripcion')}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(170,255,0,0.2)]"
        >
          Nueva Inscripción
        </button>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard icono={Users} valor={data.clientesActivos} label="Clientes activos" />

        <MetricCard
          icono={AlertTriangle}
          valor={data.clientesMorosos}
          label="Clientes morosos"
          colorValor={data.clientesMorosos > 0 ? 'text-red-400' : 'text-white'}
        />

        <MetricCard
          icono={CreditCard}
          valor={data.membresiasPorVencer}
          label="Vencen en 3 días"
          colorValor={data.membresiasPorVencer > 0 ? 'text-yellow-400' : 'text-white'}
        />

        <MetricCard
          icono={DollarSign}
          valor={formatearMonto(data.ingresosMes)}
          label="Ingresos del mes"
          colorValor="text-[#AAFF00]"
          extra={data.variacionIngresos !== null && (
            <span className={data.variacionIngresos >= 0 ? 'text-[#AAFF00]' : 'text-red-400'}>
              {data.variacionIngresos >= 0 ? '↑' : '↓'} {Math.abs(data.variacionIngresos)}% vs mes anterior
            </span>
          )}
        />

        {/* Aforo en vivo, con link directo a la pantalla completa */}
        <button
          onClick={() => navigate('/asistencias')}
          className="bg-[#111111] border border-[#333333] rounded-xl p-5 text-left hover:border-[#AAFF00] transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity size={18} className="text-[#AAFF00]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#AAFF00] animate-pulse"></span>
          </div>
          <p className="text-white font-bold text-2xl">{data.personasDentro}/{data.capacidadMaxima}</p>
          <p className="text-gray-500 text-xs mt-1">Aforo actual</p>
          <div className="w-full h-1 bg-[#0a0a0a] rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${porcentajeAforo >= 100 ? 'bg-red-500' : porcentajeAforo >= 75 ? 'bg-yellow-500' : 'bg-[#AAFF00]'}`}
              style={{ width: `${Math.min(porcentajeAforo, 100)}%` }}
            ></div>
          </div>
        </button>

        <MetricCard
          icono={Calendar}
          valor={data.clasesHoy.length}
          label="Clases programadas hoy"
          extra={data.clasesHoy[0] && (
            <span className="text-gray-500">Próxima: {data.clasesHoy[0].nombre} {data.clasesHoy[0].horaInicio}hs</span>
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Alertas pendientes */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#333333] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              Alertas pendientes
              <span className="bg-[#AAFF00]/20 text-[#AAFF00] text-xs font-bold px-2 py-0.5 rounded-full">
                {data.alertas.length}
              </span>
            </h3>
            <button onClick={() => navigate('/membresias')} className="text-[#AAFF00] text-xs flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          {data.alertas.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">No hay alertas pendientes. Todo está en orden ✅</p>
          ) : (
            <div className="space-y-2">
              {data.alertas.map((alerta, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 ${alerta.tipo === 'vencida' ? 'border-l-red-500 bg-red-500/5' : 'border-l-yellow-500 bg-yellow-500/5'
                    }`}
                >
                  <span className="text-base">{alerta.tipo === 'vencida' ? '🔴' : '🟡'}</span>
                  <p className="text-gray-300 text-sm">{alerta.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clases de hoy */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
          <h3 className="text-white font-bold text-base mb-4">Clases de hoy</h3>

          {data.clasesHoy.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay clases programadas para hoy.</p>
          ) : (
            <div className="space-y-1">
              {data.clasesHoy.map((clase) => (
                <div key={clase.id} className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
                  <span className="bg-[#0a0a0a] text-white text-xs px-2 py-1 rounded-md w-14 text-center flex-shrink-0">
                    {clase.horaInicio}
                  </span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{clase.nombre}</p>
                    <p className="text-gray-500 text-xs">{clase.instructor}</p>
                  </div>
                  <span className={`text-xs font-semibold ${clase.inscriptos >= clase.capacidadMaxima ? 'text-red-400' : 'text-[#AAFF00]'
                    }`}>
                    {clase.inscriptos}/{clase.capacidadMaxima}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// VISTA DEL ENTRENADOR
// ═══════════════════════════════════════════════
function DashboardEntrenador() {
  const navigate = useNavigate()
  // Reutilizamos el mismo hook que ya construimos en el Bloque 9
  // Nada de esto es código nuevo, es la ventaja de haberlo armado como hook
  const { aforo, cargando } = useAforo()

  const handleSalida = async (asistenciaId) => {
    try {
      await registrarSalidaService(asistenciaId)
    } catch (err) {
      alert('No se pudo registrar la salida')
    }
  }

  const porcentaje = (aforo.ocupados / aforo.capacidadMaxima) * 100
  let estado = { texto: 'Hay lugar', color: 'text-[#AAFF00]' }
  if (porcentaje >= 100) estado = { texto: 'Lleno', color: 'text-red-400' }
  else if (porcentaje >= 75) estado = { texto: 'Casi lleno', color: 'text-yellow-400' }

  return (
    <div className="space-y-6">

      {/* Acciones grandes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <button
          onClick={() => navigate('/inscripcion')}
          className="bg-primary/10 border border-primary/40 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/20 transition-colors shadow-[0_0_15px_rgba(170,255,0,0.1)]"
        >
          <div className="bg-primary/20 p-3 rounded-full mb-1">
            <LogIn size={24} className="text-primary" />
          </div>
          <p className="text-primary font-bold">Nueva Inscripción</p>
          <p className="text-gray-400 text-xs text-center">Alta de cliente y plan</p>
        </button>

        <button
          onClick={() => navigate('/asistencias')}
          className="bg-[#111111] border border-[#AAFF00]/40 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#AAFF00] transition-colors"
        >
          <div className="bg-[#1a1a1a] p-3 rounded-full mb-1">
            <LogIn size={24} className="text-[#AAFF00]" />
          </div>
          <p className="text-white font-bold">Registrar entrada</p>
          <p className="text-gray-500 text-xs text-center">Confirmá ingreso de socio</p>
        </button>

        <button
          onClick={() => navigate('/asistencias')}
          className="bg-[#111111] border border-red-500/40 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-red-500 transition-colors"
        >
          <div className="bg-[#1a1a1a] p-3 rounded-full mb-1">
            <LogOut size={24} className="text-red-400" />
          </div>
          <p className="text-white font-bold">Registrar salida</p>
          <p className="text-gray-500 text-xs text-center">Registrar egreso manual</p>
        </button>
      </div>

      {/* Aforo */}
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#AAFF00] animate-pulse"></span>
          <span className="text-[#AAFF00] text-xs font-bold">EN VIVO</span>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-5xl">{cargando ? '—' : aforo.ocupados}</p>
          <p className="text-gray-500 text-sm">de {aforo.capacidadMaxima} lugares</p>
        </div>
        <span className={`font-bold text-sm ${estado.color}`}>{estado.texto}</span>
      </div>

      {/* Clientes en el gimnasio ahora */}
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-5">
        <h3 className="text-white font-bold text-base mb-4">En el gimnasio ahora</h3>
        {!aforo.clientesDentro || aforo.clientesDentro.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No hay clientes en el gimnasio en este momento.</p>
        ) : (
          <div className="space-y-1">
            {aforo.clientesDentro.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-xs">
                    {a.cliente.nombre.charAt(0)}{a.cliente.apellido.charAt(0)}
                  </div>
                  <p className="text-white text-sm">{a.cliente.nombre} {a.cliente.apellido}</p>
                </div>
                <button
                  onClick={() => handleSalida(a.id)}
                  className="text-red-400 border border-red-500/40 text-xs px-2.5 py-1 rounded-lg hover:bg-red-500/10"
                >
                  Salida
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPONENTE PRINCIPAL — decide qué vista mostrar
// ═══════════════════════════════════════════════
function Dashboard() {
  const { usuario } = useAuth()

  return usuario?.rol === 'dueno' ? <DashboardDueno /> : <DashboardEntrenador />
}

export default Dashboard