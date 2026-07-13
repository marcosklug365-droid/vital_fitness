import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { ArrowLeft, CheckCircle2, ScanLine, XCircle, LogIn, LogOut } from 'lucide-react'
import { precheckQrService, confirmarQrService } from '../../services/portalService'

export default function PortalEscaner() {
  const navigate = useNavigate()
  const [escaneando, setEscaneando] = useState(true)
  const [accionDetectada, setAccionDetectada] = useState(null) // { accion: 'entrada' | 'salida', asistenciaId?: number }
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    // Si no estamos en estado de escaneo, no inicializamos
    if (!escaneando) return

    const html5Qrcode = new Html5Qrcode("reader")
    scannerRef.current = html5Qrcode

    const config = { fps: 10, qrbox: { width: 250, height: 250 } }

    html5Qrcode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        // Detenemos el escáner inmediatamente
        html5Qrcode.stop().catch(console.error)
        setEscaneando(false)
        procesarQrLeido(decodedText)
      },
      (errorMessage) => {
        // Los errores de lectura (frames sin QR) son normales y frecuentes, no hacemos nada
      }
    ).catch((err) => {
      setError("No pudimos acceder a tu cámara. Verificá los permisos.")
      setEscaneando(false)
    })

    return () => {
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(console.error)
      }
    }
  }, [escaneando])

  const procesarQrLeido = async (qrText) => {
    try {
      setProcesando(true)
      const data = await precheckQrService(qrText)
      setAccionDetectada(data) // data.accion === 'entrada' || 'salida'
    } catch (err) {
      setError(err.response?.data?.error || "Error al leer el código.")
    } finally {
      setProcesando(false)
    }
  }

  const confirmarAccion = async () => {
    try {
      setProcesando(true)
      const data = await confirmarQrService(accionDetectada)
      setExito({
        mensaje: data.mensaje,
        accion: accionDetectada.accion
      })
      setAccionDetectada(null)
      
      // Volver automáticamente al escáner luego de 4 segundos
      setTimeout(() => {
        setExito(null)
        setEscaneando(true)
      }, 4000)

    } catch (err) {
      setError(err.response?.data?.error || "Error al procesar la solicitud.")
    } finally {
      setProcesando(false)
    }
  }

  const reintentar = () => {
    setError(null)
    setAccionDetectada(null)
    setEscaneando(true)
  }

  return (
    <div className="flex flex-col min-h-[90vh] relative bg-black">
      
      {/* Header fijo */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 flex items-center justify-between">
        <button 
          onClick={() => navigate('/portal/inicio')}
          className="p-3 text-white bg-black/50 backdrop-blur-md rounded-full shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Contenedor del escáner */}
      {escaneando && !error && !exito && !accionDetectada && (
        <div className="flex-1 flex flex-col relative bg-black pt-16">
          <div className="text-center px-4 py-4 z-10">
            <h2 className="text-xl font-bold text-white tracking-tight">Escaneá el QR</h2>
            <p className="text-gray-400 text-sm mt-1">Apunta tu cámara al código de la sucursal.</p>
          </div>
          
          <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-3xl mt-4">
            <div id="reader" className="w-full h-full rounded-3xl object-cover bg-gray-900"></div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-6">
            <ScanLine size={48} className="text-[#AAFF00] animate-pulse opacity-50" />
          </div>
        </div>
      )}

      {/* Overlay de Procesando Inicial */}
      {procesando && !accionDetectada && !error && !exito && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 border-4 border-[#333333] border-t-[#AAFF00] rounded-full animate-spin mb-4"></div>
          <p className="text-white font-medium">Validando información...</p>
        </div>
      )}

      {/* Overlay de Confirmación (Pre-Check) */}
      {accionDetectada && !error && !exito && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-[#111111] w-full rounded-t-3xl p-6 border-t border-[#333333] pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-300">
            
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center">
                {accionDetectada.accion === 'entrada' ? (
                  <LogIn size={36} className="text-[#AAFF00]" />
                ) : (
                  <LogOut size={36} className="text-yellow-500" />
                )}
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                Registrar {accionDetectada.accion === 'entrada' ? 'Entrada' : 'Salida'}
              </h2>
              <p className="text-gray-400">
                ¿Deseás confirmar tu {accionDetectada.accion} al gimnasio?
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={reintentar}
                disabled={procesando}
                className="flex-1 bg-transparent border border-[#333333] text-white font-bold py-4 rounded-xl hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarAccion}
                disabled={procesando}
                className={`flex-1 font-bold py-4 rounded-xl transition-colors ${
                  accionDetectada.accion === 'entrada' 
                    ? 'bg-[#AAFF00] text-black hover:bg-[#99e600]' 
                    : 'bg-yellow-500 text-black hover:bg-yellow-600'
                }`}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Éxito */}
      {exito && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full bg-[#111111] flex items-center justify-center mb-6">
            <CheckCircle2 size={64} className={exito.accion === 'entrada' ? 'text-[#AAFF00]' : 'text-yellow-500'} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            ¡{exito.accion === 'entrada' ? 'Bienvenido' : 'Hasta luego'}!
          </h2>
          <p className="text-gray-400 text-center max-w-[250px]">
            {exito.mensaje}
          </p>
          <div className="absolute bottom-10">
            <div className="w-32 h-1 bg-[#222222] rounded-full overflow-hidden">
              <div className="h-full bg-gray-500 origin-left animate-[shrink_4s_linear_forwards]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Error */}
      {error && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/30">
            <XCircle size={64} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Operación Rechazada
          </h2>
          <p className="text-red-400 text-center max-w-[280px] mb-8">
            {error}
          </p>
          <button 
            onClick={reintentar}
            className="bg-[#222222] text-white px-8 py-3 rounded-full font-medium hover:bg-[#333333] transition-colors"
          >
            Volver a intentar
          </button>
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
