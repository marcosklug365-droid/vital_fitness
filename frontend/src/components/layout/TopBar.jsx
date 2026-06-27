import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'

// Títulos y subtítulos para cada ruta
const titulos = {
  '/dashboard':   { titulo: 'Dashboard',            subtitulo: 'Bienvenido de vuelta' },
  '/clientes':    { titulo: 'Clientes',              subtitulo: 'Gestión de socios del gimnasio' },
  '/planes':      { titulo: 'Planes',                subtitulo: 'Tipos de membresía disponibles' },
  '/membresias':  { titulo: 'Membresías',            subtitulo: 'Control de vencimientos y renovaciones' },
  '/pagos':       { titulo: 'Pagos e ingresos',      subtitulo: 'Registros de cobros y resumen financiero' },
  '/clases':      { titulo: 'Clases',                subtitulo: 'Gestión de clases y horarios semanales' },
  '/asistencias': { titulo: 'Asistencias y Aforo',   subtitulo: 'Registrá entradas y salidas en tiempo real' },
}

function TopBar() {
  // useLocation nos da la ruta actual, por ejemplo: { pathname: '/clientes' }
  const { pathname } = useLocation()

  // Buscamos el título correspondiente a la ruta actual
  // Si no hay coincidencia exacta buscamos por si empieza con alguna ruta base
  const paginaInfo = titulos[pathname] ||
    Object.entries(titulos).find(([key]) => pathname.startsWith(key))?.[1] ||
    { titulo: 'Vital Fitness', subtitulo: '' }

  // Fecha actual formateada en español
  const fechaActual = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-[#111111] border-b border-[#333333] flex items-center justify-between px-6 z-40">

      {/* Título de la página */}
      <div>
        <h1 className="text-white font-bold text-xl leading-tight">
          {paginaInfo.titulo}
        </h1>
        {paginaInfo.subtitulo && (
          <p className="text-gray-500 text-xs">{paginaInfo.subtitulo}</p>
        )}
      </div>

      {/* Lado derecho: fecha y notificaciones */}
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-xs capitalize hidden lg:block">
          {fechaActual}
        </span>

        {/* Campana de notificaciones (placeholder por ahora) */}
        <button className="relative w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#AAFF00] transition-colors">
          <Bell size={16} />
          {/* Punto verde indicador */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#AAFF00]"></span>
        </button>
      </div>
    </header>
  )
}

export default TopBar