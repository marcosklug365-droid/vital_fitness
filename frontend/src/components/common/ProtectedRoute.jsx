import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute() {
  const { usuario } = useAuth()

  // Si no hay usuario logueado redirigimos al Login
  if (!usuario) {
    return <Navigate to="/" replace />
  }

  // Outlet renderiza la página hija de la ruta actual
  // Por ejemplo si estamos en /dashboard renderiza Dashboard
  return <Outlet />
}

export default ProtectedRoute