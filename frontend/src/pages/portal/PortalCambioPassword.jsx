import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthCliente } from '../../context/AuthClienteContext'
import { cambiarPasswordClienteService } from '../../services/portalService'
import { ShieldAlert } from 'lucide-react'

export default function PortalCambioPassword() {
  const { actualizarClienteCtx } = useAuthCliente()
  const navigate = useNavigate()
  
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      return setError('Las nuevas contraseñas no coinciden')
    }
    if (newPassword.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    try {
      setCargando(true)
      setError('')
      await cambiarPasswordClienteService({ oldPassword, newPassword })
      actualizarClienteCtx({ requiereCambioPassword: false })
      navigate('/portal/inicio')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-[#111111] p-8 rounded-2xl shadow-2xl border border-[#333333] mt-12">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="text-yellow-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cambio Obligatorio</h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Por seguridad, debés cambiar la contraseña temporal que te entregaron por una personal antes de continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Contraseña Actual (Temporal)
          </label>
          <input
            type="password"
            required
            className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#AAFF00] transition-colors"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Nueva Contraseña
          </label>
          <input
            type="password"
            required
            className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#AAFF00] transition-colors"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Repetir Nueva Contraseña
          </label>
          <input
            type="password"
            required
            className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#AAFF00] transition-colors"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-[#AAFF00] text-black font-bold py-3.5 rounded-lg hover:bg-[#99e600] transition-colors disabled:opacity-50 mt-4"
        >
          {cargando ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </form>
    </div>
  )
}
