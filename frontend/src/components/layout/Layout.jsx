import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

function Layout() {
  return (
    <div className="min-h-screen bg-black">

      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* TopBar fijo arriba, con margen izquierdo del sidebar */}
      <TopBar />

      {/* Contenido principal */}
      {/* ml-[260px] → margen izquierdo del ancho del sidebar */}
      {/* mt-16 → margen superior del alto del topbar (64px = 16 en tailwind) */}
      <main className="ml-[260px] mt-16 p-6 min-h-screen">
        {/*
          Outlet renderiza el componente de la ruta hija actual
          Si estamos en /clientes renderiza <Clientes />
          Si estamos en /pagos renderiza <Pagos />
          etc.
        */}
        <Outlet />
      </main>
    </div>
  )
}

export default Layout