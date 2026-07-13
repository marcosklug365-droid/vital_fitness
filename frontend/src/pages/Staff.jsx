import { useState, useEffect } from 'react'
import { getUsuariosService, createUsuarioService, updateUsuarioService, toggleUsuarioActivoService } from '../services/usuariosService'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, Shield, Mail, UserCircle, Power, UserX } from 'lucide-react'

// Utilidad para formatear los roles (dueno -> Dueño, etc)
const formatRole = (role) => {
  const roles = {
    dueno: 'Dueño',
    entrenador: 'Entrenador',
    recepcionista: 'Recepcionista'
  }
  return roles[role] || role
}

function Staff() {
  const { usuario: currentUsuario } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditar, setUsuarioEditar] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'entrenador'
  })

  const cargarUsuarios = async () => {
    try {
      setCargando(true)
      const data = await getUsuariosService()
      setUsuarios(data)
    } catch (error) {
      console.error('Error al cargar staff:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const handleOpenModal = (user = null) => {
    if (user) {
      setUsuarioEditar(user)
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        password: '', // la contraseña no se edita por ahora
        rol: user.rol
      })
    } else {
      setUsuarioEditar(null)
      setFormData({ nombre: '', apellido: '', email: '', password: '', rol: 'entrenador' })
    }
    setModalAbierto(true)
  }

  const handleCloseModal = () => {
    setModalAbierto(false)
    setUsuarioEditar(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (usuarioEditar) {
        await updateUsuarioService(usuarioEditar.id, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          rol: formData.rol
        })
      } else {
        await createUsuarioService(formData)
      }
      await cargarUsuarios()
      handleCloseModal()
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar el usuario')
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleEstado = async (id) => {
    if (currentUsuario.id === id) {
      alert("No podés desactivar tu propia cuenta.")
      return
    }
    if (window.confirm("¿Estás seguro de cambiar el estado de este usuario?")) {
      try {
        await toggleUsuarioActivoService(id)
        cargarUsuarios()
      } catch (error) {
        alert(error.response?.data?.error || 'Error al cambiar estado')
      }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl flex items-center gap-2">
            <Shield className="text-primary" /> Gestión de Staff
          </h2>
          <p className="text-gray-500 text-sm mt-1">Administrá los accesos y roles de tu equipo</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Nuevo integrante
        </button>
      </div>

      {/* Grilla de Tarjetas */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#111111] border border-[#333333] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#222222]"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#222222] rounded"></div>
                  <div className="h-3 w-16 bg-[#222222] rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-12 flex flex-col items-center text-center">
          <UserX size={48} className="text-gray-600 mb-4" />
          <h3 className="text-white font-bold text-lg">No hay staff registrado</h3>
          <p className="text-gray-500 text-sm mt-1">Comenzá agregando a tu primer entrenador o recepcionista.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map(u => (
            <div 
              key={u.id} 
              className={`relative overflow-hidden bg-[#111111] border rounded-xl p-5 transition-all ${u.activo ? 'border-[#333333] hover:border-primary/50' : 'border-red-900/50 opacity-75'}`}
            >
              {/* Decoración superior */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 ${u.activo ? 'bg-primary/5' : 'bg-red-500/5'}`}></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.activo ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                    {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{u.nombre} {u.apellido}</h3>
                    <p className={`text-xs font-semibold ${u.activo ? 'text-gray-400' : 'text-red-400'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
                <span className="bg-[#222222] text-gray-300 text-xs px-2 py-1 rounded border border-[#333333]">
                  {formatRole(u.rol)}
                </span>
              </div>

              <div className="space-y-2 mb-6 relative z-10">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail size={14} /> <span className="truncate">{u.email}</span>
                </div>
                {u.rol === 'entrenador' && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <UserCircle size={14} /> <span>{u._count.clases} clases asignadas</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <button
                  onClick={() => handleOpenModal(u)}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#222222] text-white text-xs font-semibold py-2 rounded-lg border border-[#333333] transition-colors"
                >
                  Editar
                </button>
                {currentUsuario.id !== u.id && (
                  <button
                    onClick={() => handleToggleEstado(u.id)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                      u.activo 
                        ? 'bg-[#1a1a1a] border-[#333333] text-red-400 hover:bg-red-500/10 hover:border-red-500/50' 
                        : 'bg-[#1a1a1a] border-[#333333] text-primary hover:bg-primary/10 hover:border-primary/50'
                    }`}
                    title={u.activo ? "Desactivar usuario" : "Activar usuario"}
                  >
                    <Power size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Creación / Edición */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#333333] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-[#333333]">
              <h3 className="text-white font-bold text-lg">
                {usuarioEditar ? 'Editar Integrante' : 'Nuevo Integrante'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase mb-1">Nombre</label>
                  <input
                    required
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase mb-1">Apellido</label>
                  <input
                    required
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase mb-1">Email (Usuario)</label>
                <input
                  required
                  type="email"
                  disabled={!!usuarioEditar}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {!usuarioEditar && (
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase mb-1">Contraseña temporal</label>
                  <input
                    required={!usuarioEditar}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase mb-1">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-3 py-2 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="entrenador">Entrenador</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="dueno">Dueño (Administrador total)</option>
                </select>
                <p className="text-gray-500 text-xs mt-2">
                  El rol define los permisos y accesos dentro del sistema. Los entrenadores podrán ser asignados a clases.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#333333] mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-transparent border border-[#333333] text-white font-bold py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex justify-center items-center gap-2"
                >
                  {guardando ? 'Guardando...' : <><Save size={18} /> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Staff
