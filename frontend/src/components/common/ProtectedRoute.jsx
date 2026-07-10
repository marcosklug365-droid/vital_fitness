import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'
import { toast } from 'sonner'

function ProtectedRoute({ roles }) {
  const { usuario } = useAuth()

  // Si no hay usuario logueado redirigimos al Login
  if (!usuario) {
    return <Navigate to="/" replace />
  }

  // Verificamos el rol si se especificaron roles permitidos
  if (roles && !roles.includes(usuario.rol)) {
    // Es mejor usar un useEffect para disparar el toast después del render
    // o simplemente no renderizar la ruta. 
    // Como esto renderiza de inmediato el Navigate, el toast puede perderse.
    // Lo disparamos directamente con el evento custom que armamos en App.jsx
    document.dispatchEvent(new CustomEvent('toast-error', { detail: 'No tienes permisos para acceder a esta pantalla.' }))
    return <Navigate to="/dashboard" replace />
  }

  // Outlet renderiza la página hija de la ruta actual
  return <Outlet />
}

export default ProtectedRoute