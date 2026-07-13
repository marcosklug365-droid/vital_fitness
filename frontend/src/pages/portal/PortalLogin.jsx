import { useState } from 'react'
import { useAuthCliente } from '../../context/AuthClienteContext'
import { loginClienteService } from '../../services/portalService'

export default function PortalLogin() {
  const { loginClienteCtx } = useAuthCliente()
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setCargando(true)
      setError('')
      const data = await loginClienteService({ dni, password })
      loginClienteCtx(data.token, data.cliente)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 bg-[url('/bg-pattern.svg')] bg-repeat bg-fixed">
      <div className="w-full max-w-sm bg-[#111111] p-8 rounded-2xl shadow-2xl border border-[#333333]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#AAFF00] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(170,255,0,0.4)]">
            <span className="text-black font-black text-2xl">VF</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Portal del Cliente</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresá tus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Documento (DNI)
            </label>
            <input
              type="text"
              required
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#AAFF00] transition-colors"
              placeholder="Ej: 12345678"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#AAFF00] transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#AAFF00] text-black font-bold py-3.5 rounded-lg hover:bg-[#99e600] transition-colors disabled:opacity-50 mt-4"
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
