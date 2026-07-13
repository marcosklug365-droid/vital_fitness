import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const AuthClienteContext = createContext()

export const useAuthCliente = () => {
  return useContext(AuthClienteContext)
}

export const AuthClienteProvider = ({ children }) => {
  const [cliente, setCliente] = useState(null)
  const [cargandoCliente, setCargandoCliente] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Solo validamos token de cliente
    const token = localStorage.getItem('token_cliente')
    const clienteGuardado = localStorage.getItem('cliente')
    
    if (token && clienteGuardado) {
      setCliente(JSON.parse(clienteGuardado))
    }
    setCargandoCliente(false)
  }, [])

  const loginClienteCtx = (token, datosCliente) => {
    localStorage.setItem('token_cliente', token)
    localStorage.setItem('cliente', JSON.stringify(datosCliente))
    setCliente(datosCliente)
    
    if (datosCliente.requiereCambioPassword) {
      navigate('/portal/cambiar-password')
    } else {
      navigate('/portal/inicio')
    }
  }

  const logoutClienteCtx = () => {
    localStorage.removeItem('token_cliente')
    localStorage.removeItem('cliente')
    setCliente(null)
    navigate('/portal/login')
  }

  const actualizarClienteCtx = (nuevosDatos) => {
    const actualizado = { ...cliente, ...nuevosDatos }
    setCliente(actualizado)
    localStorage.setItem('cliente', JSON.stringify(actualizado))
  }

  // Redirecciones seguras para rutas de portal
  useEffect(() => {
    if (cargandoCliente) return
    const isPortalRoute = location.pathname.startsWith('/portal')
    if (!isPortalRoute) return

    const token = localStorage.getItem('token_cliente')
    const isLoginPage = location.pathname === '/portal/login'
    
    if (!token && !isLoginPage) {
      navigate('/portal/login')
    } else if (token && isLoginPage) {
      if (cliente?.requiereCambioPassword) {
        navigate('/portal/cambiar-password')
      } else {
        navigate('/portal/inicio')
      }
    } else if (token && cliente?.requiereCambioPassword && location.pathname !== '/portal/cambiar-password') {
      // Bloquear navegación si requiere cambio de clave
      navigate('/portal/cambiar-password')
    }
  }, [cargandoCliente, location.pathname, cliente, navigate])

  return (
    <AuthClienteContext.Provider value={{
      cliente,
      cargandoCliente,
      loginClienteCtx,
      logoutClienteCtx,
      actualizarClienteCtx
    }}>
      {children}
    </AuthClienteContext.Provider>
  )
}
