import { useState, useEffect, useRef } from 'react'
import { buscarClientePorDniService } from '../services/clientesService'
import { registrarEntradaService } from '../services/asistenciasService'
import { Activity, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Kiosco() {
  const navigate = useNavigate()
  const [dni, setDni] = useState('')
  const [estado, setEstado] = useState('idle') // idle, cargando, exito, error
  const [mensaje, setMensaje] = useState(null)
  const inputRef = useRef(null)

  // Autofocus infinito para lectores de código de barras o teclado
  useEffect(() => {
    const enfocar = () => {
      if (estado === 'idle' && inputRef.current) {
        inputRef.current.focus()
      }
    }
    enfocar()
    window.addEventListener('click', enfocar)
    return () => window.removeEventListener('click', enfocar)
  }, [estado])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!dni || dni.length < 6) return

    setEstado('cargando')
    try {
      const cliente = await buscarClientePorDniService(dni)

      if (!cliente) {
        throw new Error('No se encontró ningún cliente con ese DNI.')
      }

      // Llamamos directamente al backend, que ahora tiene la lógica estricta de validación (403 si está vencida)
      await registrarEntradaService(cliente.id)
      
      setMensaje(`¡Bienvenido, ${cliente.nombre}!`)
      setEstado('exito')

    } catch (err) {
      setMensaje(err.response?.data?.error || err.message || 'Error al validar el ingreso.')
      setEstado('error')
    }

    // Resetear después de 4 segundos
    setTimeout(() => {
      setDni('')
      setMensaje(null)
      setEstado('idle')
    }, 4000)
  }

  const handlePadClick = (num) => {
    if (estado !== 'idle') return
    if (num === 'C') setDni('')
    else if (num === 'DEL') setDni(d => d.slice(0, -1))
    else setDni(d => d + num)
  }

  // Renderizados según estado
  if (estado === 'exito') {
    return (
      <div className="min-h-screen bg-[#AAFF00] flex flex-col items-center justify-center p-4">
        <CheckCircle2 size={120} className="text-black mb-6" />
        <h1 className="text-6xl font-bold text-black text-center mb-4">{mensaje}</h1>
        <p className="text-black/80 text-2xl font-medium">Ingreso registrado correctamente</p>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen bg-red-500 flex flex-col items-center justify-center p-4">
        <XCircle size={120} className="text-white mb-6 animate-pulse" />
        <h1 className="text-5xl font-bold text-white text-center mb-4 leading-tight max-w-4xl">{mensaje}</h1>
        <p className="text-white/80 text-2xl font-medium">Acceso denegado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      
      {/* Botón oculto para volver al sistema (útil para el dueño) */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 text-gray-800 hover:text-gray-500 transition-colors p-4"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-primary flex items-center justify-center rounded-full mb-4 shadow-[0_0_30px_rgba(170,255,0,0.3)]">
            <Activity size={40} className="text-black" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-wider">VITAL FITNESS</h1>
          <p className="text-primary text-sm tracking-widest uppercase mt-1 font-bold">Auto Check-in</p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full mb-10">
          <input
            ref={inputRef}
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
            placeholder="Ingresá tu DNI"
            className="w-full bg-[#111111] border-2 border-[#333333] focus:border-primary focus:outline-none rounded-2xl px-6 py-6 text-center text-4xl text-white font-bold tracking-widest transition-colors shadow-2xl"
            disabled={estado === 'cargando'}
            autoComplete="off"
          />
          {estado === 'cargando' && (
            <p className="text-primary text-center mt-4 animate-pulse font-medium">Verificando...</p>
          )}
        </form>

        {/* Teclado en pantalla */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handlePadClick(num.toString())}
              className="bg-[#111111] hover:bg-[#1a1a1a] active:bg-[#222222] border border-[#333333] text-white text-3xl font-bold py-6 rounded-2xl transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePadClick('C')}
            className="bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-500 border border-red-500/20 text-2xl font-bold py-6 rounded-2xl transition-colors"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handlePadClick('0')}
            className="bg-[#111111] hover:bg-[#1a1a1a] active:bg-[#222222] border border-[#333333] text-white text-3xl font-bold py-6 rounded-2xl transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handlePadClick('DEL')}
            className="bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500/30 text-yellow-500 border border-yellow-500/20 text-xl font-bold py-6 rounded-2xl transition-colors"
          >
            DEL
          </button>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={!dni || estado === 'cargando'}
          className="w-full mt-6 bg-primary text-black font-black text-xl py-6 rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(170,255,0,0.2)]"
        >
          INGRESAR
        </button>
      </div>
    </div>
  )
}
