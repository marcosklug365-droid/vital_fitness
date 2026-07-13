import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthClienteProvider } from './context/AuthClienteContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import LayoutCliente from './components/LayoutCliente'

// Paginas Staff
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
import Kiosco from './pages/Kiosco'
import Staff from './pages/Staff'

// Paginas Portal
import PortalLogin from './pages/portal/PortalLogin'
import PortalCambioPassword from './pages/portal/PortalCambioPassword'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalEscaner from './pages/portal/PortalEscaner'
import PortalHistorial from './pages/portal/PortalHistorial'

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
        <AuthClienteProvider>
          <Toaster />
          <Routes>

            {/* Rutas Públicas / Staff */}
            <Route path="/" element={<Login />} />
            
            {/* Rutas Portal Cliente */}
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/cambiar-password" element={<PortalCambioPassword />} />
            <Route element={<LayoutCliente />}>
              <Route path="/portal/inicio" element={<PortalDashboard />} />
              <Route path="/portal/escaner" element={<PortalEscaner />} />
              <Route path="/portal/historial" element={<PortalHistorial />} />
            </Route>

            {/* Rutas Protegidas Staff */}
            <Route element={<ProtectedRoute />}>
              
              {/* Kiosco de Asistencia (Pantalla independiente) */}
              <Route path="/kiosco" element={<Kiosco />} />
              
              {/* Rutas con Layout Administrativo */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/nuevo" element={<ClienteFormulario />} />
                <Route path="/clientes/editar/:id" element={<ClienteFormulario />} />
                <Route path="/clientes/:id" element={<ClienteDetalle />} />
                
                <Route path="/inscripcion" element={<InscripcionWizard />} />
                
                <Route path="/clases" element={<Clases />} />
                <Route path="/asistencias" element={<Asistencias />} />
                
                {/* Rutas exclusivas para el dueño */}
                <Route element={<ProtectedRoute roles={['dueno']} />}>
                  <Route path="/planes" element={<Planes />} />
                  <Route path="/membresias" element={<Membresias />} />
                  <Route path="/pagos" element={<Pagos />} />
                  <Route path="/staff" element={<Staff />} />
                </Route>
              </Route>

            </Route>

          </Routes>
        </AuthClienteProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App