import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Activity, Loader2, Users } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-xs font-semibold uppercase mb-1">{label}</p>
        <p className="text-[#00d4ff] font-bold text-lg flex items-center gap-2">
          <Users size={16} /> {payload[0].value} ingresos
        </p>
      </div>
    )
  }
  return null
}

export default function GraficoAsistencia({ data, cargando }) {
  if (cargando) {
    return (
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-5 h-[350px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  const maxTotal = data?.maximaAsistencia || 0
  const hasData = maxTotal > 0

  return (
    <div className="bg-[#111111] border border-[#333333] rounded-xl p-5 flex flex-col h-[400px]">
      
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={18} className="text-[#00d4ff]" />
            <h3 className="text-white font-bold text-lg">Asistencia por Hora</h3>
          </div>
          
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-white">
              {data?.horaPico || '--:--'}
            </p>
            {hasData && (
              <div className="flex items-center gap-1 text-sm font-semibold mb-1 text-[#00d4ff]">
                <span>Hora Pico ({maxTotal} ingresos)</span>
              </div>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">Acumulado del período seleccionado</p>
        </div>
      </div>

      {/* Gráfico o Empty State */}
      <div className="flex-1 min-h-0 w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 border border-[#333333]">
              <Users className="text-gray-600" size={24} />
            </div>
            <p className="text-gray-400 font-medium">No hay registros de asistencia</p>
            <p className="text-gray-600 text-xs mt-1">Los ingresos aparecerán agrupados por hora</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.porHora} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis 
                dataKey="hora" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 11 }} 
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#222222' }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.porHora.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.total === maxTotal ? '#00d4ff' : '#00d4ff40'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
