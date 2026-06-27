import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getClienteByIdService,
  createClienteService,
  updateClienteService
} from '../services/clientesService'
import { ArrowLeft, Save } from 'lucide-react'

// Componente reutilizable para cada campo del formulario
function CampoFormulario({ label, obligatorio, children }) {
  return (
    <div>
      <label className="block text-white text-sm mb-2">
        {label}
        {obligatorio && <span className="text-[#AAFF00] ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

function ClienteFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    direccion: '',
    contactoDeEmergencia: ''
  })

  // Si es edición cargamos los datos del cliente
  useEffect(() => {
    if (esEdicion) {
      cargarCliente()
    }
  }, [id])

  const cargarCliente = async () => {
    try {
      setCargando(true)
      const data = await getClienteByIdService(id)
      setForm({
        nombre:             data.nombre || '',
        apellido:           data.apellido || '',
        dni:                data.dni || '',
        telefono:           data.telefono || '',
        email:              data.email || '',
        fechaNacimiento:    data.fechaNacimiento
          ? new Date(data.fechaNacimiento).toISOString().split('T')[0]
          : '',
        direccion:          data.direccion || '',
        contactoDeEmergencia: data.contactoDeEmergencia || ''
      })
    } catch (error) {
      setError('No se pudo cargar el cliente')
    } finally {
      setCargando(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      if (esEdicion) {
        await updateClienteService(id, form)
      } else {
        await createClienteService(form)
      }
      navigate('/clientes')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  const estiloInput = "w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#AAFF00] transition-colors"

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Cargando datos del cliente...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clientes')}
          className="w-9 h-9 rounded-lg bg-[#111111] border border-[#333333] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-white font-bold text-2xl">
            {esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <p className="text-gray-500 text-sm">
            {esEdicion
              ? 'Modificá los datos del socio'
              : 'Completá los datos del nuevo socio'}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sección datos personales */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 space-y-5">
          <h3 className="text-[#AAFF00] font-semibold text-sm uppercase tracking-wider border-b border-[#333333] pb-3">
            👤 Datos personales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CampoFormulario label="Nombre" obligatorio>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className={estiloInput}
                required
              />
            </CampoFormulario>

            <CampoFormulario label="Apellido" obligatorio>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className={estiloInput}
                required
              />
            </CampoFormulario>

            <CampoFormulario label="DNI" obligatorio>
              <input
                type="text"
                name="dni"
                value={form.dni}
                onChange={handleChange}
                placeholder="Ej: 32456789"
                className={estiloInput}
                required
              />
            </CampoFormulario>

            <CampoFormulario label="Fecha de nacimiento">
              <input
                type="date"
                name="fechaNacimiento"
                value={form.fechaNacimiento}
                onChange={handleChange}
                className={estiloInput}
              />
            </CampoFormulario>

            <CampoFormulario label="Teléfono">
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej: 3777123456"
                className={estiloInput}
              />
            </CampoFormulario>

            <CampoFormulario label="Email">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Ej: juan@email.com"
                className={estiloInput}
              />
            </CampoFormulario>

            <CampoFormulario label="Dirección" >
              <input
                type="text"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Ej: San Martín 456"
                className={`${estiloInput} sm:col-span-2`}
              />
            </CampoFormulario>
          </div>
        </div>

        {/* Sección contacto de emergencia */}
        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 space-y-5">
          <h3 className="text-[#AAFF00] font-semibold text-sm uppercase tracking-wider border-b border-[#333333] pb-3">
            🆘 Contacto de emergencia
          </h3>

          <CampoFormulario label="Nombre y teléfono del contacto">
            <input
              type="text"
              name="contactoDeEmergencia"
              value={form.contactoDeEmergencia}
              onChange={handleChange}
              placeholder="Ej: María Pérez — 3777987654"
              className={estiloInput}
            />
          </CampoFormulario>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="px-5 py-2.5 rounded-lg border border-[#333333] text-gray-400 hover:text-white hover:border-[#555] transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-[#AAFF00] text-black font-bold px-5 py-2.5 rounded-lg hover:bg-[#99ee00] transition-colors text-sm disabled:opacity-50"
          >
            <Save size={16} />
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClienteFormulario