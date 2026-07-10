import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import ClienteFormulario from './pages/ClienteFormulario'
import Planes from './pages/Planes'
import Membresias from './pages/Membresias'
import Pagos from './pages/Pagos'
import Clases from './pages/Clases'
import Asistencias from './pages/Asistencias'
import InscripcionWizard from './pages/InscripcionWizard'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const handleToastError = (event) => {
      toast.error(event.detail)
    }
    document.addEventListener('toast-error', handleToastError)
    return () => {
      document.removeEventListener('toast-error', handleToastError)
    }
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>

          {/* Ruta pública: no requiere login */}
          <Route path="/" element={<Login />} />

          {/*
            Rutas protegidas anidadas:
            1. ProtectedRoute verifica si hay usuario logueado
            2. Layout renderiza Sidebar + TopBar + Outlet
            3. Cada ruta hija renderiza su página en el Outlet
          */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"           element={<Dashboard />} />
              <Route path="/inscripcion"         element={<InscripcionWizard />} />
              <Route path="/clientes"            element={<Clientes />} />
              <Route path="/clientes/:id"        element={<ClienteDetalle />} />
              <Route path="/clientes/nuevo"      element={<ClienteFormulario />} />
              <Route path="/clientes/editar/:id" element={<ClienteFormulario />} />

              {/* Rutas exclusivas para el dueño */}
              <Route element={<ProtectedRoute roles={['dueno']} />}>
                <Route path="/planes"              element={<Planes />} />
                <Route path="/membresias"          element={<Membresias />} />
                <Route path="/pagos"               element={<Pagos />} />
              </Route>

              <Route path="/clases"              element={<Clases />} />
              <Route path="/asistencias"         element={<Asistencias />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App