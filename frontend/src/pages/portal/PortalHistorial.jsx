import { useState, useEffect } from 'react'
import { getPerfilClienteService } from '../../services/portalService'
import { CheckCircle2, XCircle, CreditCard, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PortalHistorial() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await getPerfilClienteService()
        setData(res)
      } catch (error) {
        console.error(error)
      } finally {
        setCargando(false)
      }
    }
    fetchPerfil()
  }, [])

  if (cargando) {
    return <div className="p-6 text-center text-gray-500 mt-20">Cargando historial...</div>
  }

  if (!data) {
    return <div className="p-6 text-center text-red-400 mt-20">No se pudo cargar la información.</div>
  }

  const { historialMembresias, historialPagos } = data

  return (
    <div className="p-5 pb-8 space-y-8">
      
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/portal/inicio')}
          className="p-2 text-gray-500 hover:text-white bg-[#111111] rounded-lg border border-[#333333]"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-white">Mi Historial</h2>
      </div>

      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
          Membresías
        </h3>
        {historialMembresias.length === 0 ? (
          <p className="text-gray-500 text-sm">No tenés membresías registradas.</p>
        ) : (
          <div className="space-y-3">
            {historialMembresias.map((mem) => (
              <div key={mem.id} className="bg-[#111111] border border-[#333333] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{mem.plan.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(mem.fechaInicio).toLocaleDateString('es-AR')} - {new Date(mem.fechaVencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
                {mem.estado === 'activa' ? (
                  <div className="flex items-center gap-1 text-[#AAFF00] bg-[#AAFF00]/10 px-2 py-1 rounded-md text-xs font-bold">
                    <CheckCircle2 size={14} /> Activa
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500 bg-[#222222] px-2 py-1 rounded-md text-xs font-bold">
                    <XCircle size={14} /> Vencida
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
          Pagos Realizados
        </h3>
        {historialPagos.length === 0 ? (
          <p className="text-gray-500 text-sm">No tenés pagos registrados.</p>
        ) : (
          <div className="space-y-3">
            {historialPagos.map((pago) => (
              <div key={pago.id} className="bg-[#111111] border border-[#333333] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1a1a1a] p-2 rounded-lg text-gray-400">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {pago.metodo === 'efectivo' ? 'Efectivo' : pago.metodo === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#AAFF00] font-bold">${Number(pago.monto).toLocaleString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
