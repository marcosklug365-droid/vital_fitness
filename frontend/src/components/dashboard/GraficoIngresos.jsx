// eslint-disable-next-line no-unused-vars
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react'

// Utilidad para formatear dinero
function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(monto || 0)
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-xs font-semibold uppercase mb-1">{label}</p>
        <p className="text-[#AAFF00] font-bold text-lg">
          {formatearMonto(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export default function GraficoIngresos({ data, cargando, rango, setRango }) {
  if (cargando) {
    return (
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-5 h-[350px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Estado vacío elegante si no hay datos
  const hasData = data?.tendencia && data.tendencia.some(d => d.total > 0)
  const variacion = data?.variacion || 0
  const isPositiva = variacion >= 0

  return (
    <div className="bg-[#111111] border border-[#333333] rounded-xl p-5 flex flex-col h-[400px]">
      
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={18} className="text-primary" />
            <h3 className="text-white font-bold text-lg">Ingresos</h3>
          </div>
          
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-white">
              {formatearMonto(data?.totalPeriodo)}
            </p>
            {variacion !== null && (
              <div className={`flex items-center gap-1 text-sm font-semibold mb-1 ${isPositiva ? 'text-primary' : 'text-red-400'}`}>
                {isPositiva ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isPositiva ? '+' : ''}{variacion}%</span>
              </div>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">vs período anterior</p>
        </div>

        {/* Filtro de Rango */}
        <select
          value={rango}
          onChange={(e) => setRango(e.target.value)}
          className="bg-[#1a1a1a] border border-[#333333] text-white text-sm rounded-lg px-3 py-1.5 focus:border-primary focus:outline-none transition-colors"
        >
          <option value="30dias">Últimos 30 días</option>
          <option value="6meses">Últimos 6 meses</option>
          <option value="1anio">Último año</option>
        </select>
      </div>

      {/* Gráfico o Empty State */}
      <div className="flex-1 min-h-0 w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 border border-[#333333]">
              <DollarSign className="text-gray-600" size={24} />
            </div>
            <p className="text-gray-400 font-medium">No hay ingresos en este período</p>
            <p className="text-gray-600 text-xs mt-1">Los pagos registrados aparecerán aquí</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.tendencia} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#AAFF00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#AAFF00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 12 }}
                tickFormatter={(val) => `$${val/1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#AAFF00" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorIngresos)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
