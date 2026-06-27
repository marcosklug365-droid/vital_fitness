import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginService } from '../services/authService'
import logo from '../assets/logo.png'

function Login() {

  // Estados del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  // login viene del AuthContext → guarda los datos del usuario
  const { login } = useAuth()

  // navigate es el hook de React Router para redirigir
  const navigate = useNavigate()

  const handleSubmit = async (e) => {

    // Evita que el formulario recargue la página (comportamiento por defecto del HTML)
    e.preventDefault()

    // Limpiamos el error anterior y activamos el estado de carga
    setError('')
    setCargando(true)

    try {
      // Llamamos al backend a través del servicio
      const data = await loginService(email, password)

      // Guardamos los datos en el AuthContext y localStorage
      login(data.usuario, data.token)

      // Redirigimos al dashboard
      navigate('/dashboard')

    } catch (err) {

      // Si el backend respondió con un error lo mostramos
      // err.response?.data?.error viene de axios cuando el servidor responde con error
      setError(err.response?.data?.error || 'No se pudo conectar con el servidor')

    } finally {
      // Siempre desactivamos el estado de carga al terminar
      setCargando(false)
    }
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#111111] border border-[#333333] rounded-xl p-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Vital Fitness" className="h-16 object-contain" />
        </div>

        {/* Subtítulo */}
        <p className="text-center text-gray-500 text-sm mb-6">
          Sistema de gestión
        </p>

        {/* Línea divisora verde */}
        <div className="border-t border-[#AAFF00] mb-8"></div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>

          {/* Campo email */}
          <div className="mb-5">
            <label className="block text-white text-sm mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresá tu correo"
              className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#AAFF00] transition-colors"
              required
            />
          </div>

          {/* Campo contraseña */}
          <div className="mb-6">
            <label className="block text-white text-sm mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#AAFF00] transition-colors pr-12"
                required
              />
              {/* Botón para mostrar/ocultar contraseña */}
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-sm"
              >
                {mostrarPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#AAFF00] text-black font-bold py-3 rounded-lg hover:bg-[#99ee00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Pie del formulario */}
        <p className="text-center text-gray-600 text-xs mt-6">
          ¿Problemas para ingresar? Contactá al administrador
        </p>
      </div>
    </div>
  )
}

export default Login