import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, History, QrCode, LogOut, User } from 'lucide-react'
import { useAuthCliente } from '../context/AuthClienteContext'

export default function LayoutCliente() {
  const { logoutClienteCtx, cliente } = useAuthCliente()
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { name: 'Inicio', path: '/portal/inicio', icon: Home },
    { name: 'Escanear', path: '/portal/escaner', icon: QrCode },
    { name: 'Historial', path: '/portal/historial', icon: History }
  ]

  // Si está forzado a cambiar password, solo mostramos el layout vacío sin navbar
  if (cliente?.requiereCambioPassword) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center bg-[url('/bg-pattern.svg')] bg-repeat bg-fixed">
      {/* Contenedor principal estilo móvil pero adaptable a PC */}
      <div className="w-full max-w-md bg-[#111111] min-h-screen shadow-2xl relative pb-20 flex flex-col">
        
        {/* Header superior */}
        <header className="px-6 py-5 border-b border-[#333333] flex justify-between items-center bg-[#111111]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#AAFF00]/10 flex items-center justify-center text-[#AAFF00] font-bold border border-[#AAFF00]/30">
              {cliente?.nombre?.charAt(0)}{cliente?.apellido?.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-gray-400">Hola,</p>
              <p className="text-sm font-bold text-white">{cliente?.nombre}</p>
            </div>
          </div>
          <button 
            onClick={logoutClienteCtx}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 w-full h-16 bg-[#1a1a1a] border-t border-[#333333] flex items-center justify-around z-20">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive ? 'text-[#AAFF00]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={isActive ? 22 : 20} className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium tracking-wide">{tab.name}</span>
                {/* Indicador inferior */}
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-1 bg-[#AAFF00] rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
