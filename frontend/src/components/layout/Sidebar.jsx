import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  DollarSign,
  Calendar,
  UserCheck,
  LogOut
} from 'lucide-react'

// Links de navegación según el rol
const navDueno = [
  { path: '/dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/clientes',     label: 'Clientes',           icon: Users },
  { path: '/planes',       label: 'Planes',             icon: ClipboardList },
  { path: '/membresias',   label: 'Membresías',         icon: CreditCard },
  { path: '/pagos',        label: 'Pagos',              icon: DollarSign },
  { path: '/clases',       label: 'Clases',             icon: Calendar },
  { path: '/asistencias',  label: 'Asistencias y Aforo', icon: UserCheck },
]

const navEntrenador = [
  { path: '/dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/clientes',     label: 'Clientes',           icon: Users },
  { path: '/clases',       label: 'Clases',             icon: Calendar },
  { path: '/asistencias',  label: 'Asistencias y Aforo', icon: UserCheck },
]

function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  // Elegimos los links según el rol del usuario logueado
  const navItems = usuario?.rol === 'dueno' ? navDueno : navEntrenador

  const handleLogout = () => {
    logout()       // Limpia el AuthContext y localStorage
    navigate('/')  // Redirige al Login
  }

  // Iniciales del usuario para el avatar
  const iniciales = `${usuario?.nombre?.charAt(0) || ''}${usuario?.apellido?.charAt(0) || ''}`

  return (
    <aside className="fixed top-0 left-0 h-screen w-[260px] bg-[#111111] border-r border-[#333333] flex flex-col z-50">

      {/* Logo */}
      <div className="p-6 border-b border-[#333333]">
        <img
          src={logo}
          alt="Vital Fitness"
          className="h-10 object-contain"
        />
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                {/*
                  NavLink recibe una función como className
                  que recibe { isActive } para saber si la ruta está activa
                  Así aplicamos estilos diferentes al link activo
                */}
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-[#AAFF00]/10 text-[#AAFF00] border-l-2 border-[#AAFF00] pl-[14px]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Usuario y logout */}
      <div className="p-4 border-t border-[#333333]">

        {/* Info del usuario */}
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-[#AAFF00] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
            {iniciales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {usuario?.nombre} {usuario?.apellido}
            </p>
            <p className="text-[#AAFF00] text-xs">
              {usuario?.rol === 'dueno' ? 'Dueño' : 'Entrenador'}
            </p>
          </div>
        </div>

        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar