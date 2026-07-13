import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { useBuscarCliente } from '../hooks/useBuscarCliente'
import { getPlanesService } from '../services/planesService'
import { inscribirClienteService } from '../services/membresiasService'
import { formatMoney, formatDate } from '../utils/formatters'
import { Search, UserCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Pasos del Wizard
const PASO_CLIENTE = 1
const PASO_PLAN = 2
const PASO_PAGO = 3

export default function InscripcionWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paso, setPaso] = useState(PASO_CLIENTE)
  const [enviando, setEnviando] = useState(false)
  const [autoAvanzando, setAutoAvanzando] = useState(false)
  
  // Estado global del formulario
  const [formulario, setFormulario] = useState({
    clienteId: null, // Si es un cliente existente
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    // Paso 2 y 3
    planId: null,
    fechaInicio: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    medioPago: 'efectivo',
    monto: 0
  })

  // Destructuramos el hook de búsqueda
  const { dni, setDni, clienteEncontrado, buscando } = useBuscarCliente()

  // Estado para los planes
  const [planes, setPlanes] = useState([])
  const [cargandoPlanes, setCargandoPlanes] = useState(false)

  // Sincronizar el DNI del input con el formulario general
  useEffect(() => {
    setFormulario(prev => ({ ...prev, dni }))
  }, [dni])

  // Inicializar DNI desde la URL (para renovaciones rápidas)
  useEffect(() => {
    const dniUrl = searchParams.get('dni')
    if (dniUrl) {
      setDni(dniUrl)
    }
  }, [searchParams, setDni])

  // Cargar planes al montar
  useEffect(() => {
    const fetchPlanes = async () => {
      setCargandoPlanes(true)
      try {
        const data = await getPlanesService()
        // Filtrar solo los activos
        setPlanes(data.filter(p => p.activo))
      } catch (error) {
        console.error('Error al cargar planes:', error)
      } finally {
        setCargandoPlanes(false)
      }
    }
    fetchPlanes()
  }, [])

  // Cuando el hook encuentra (o pierde) un cliente, actualizamos el formulario
  useEffect(() => {
    if (clienteEncontrado) {
      setFormulario(prev => ({
        ...prev,
        clienteId: clienteEncontrado.id,
        nombre: clienteEncontrado.nombre,
        apellido: clienteEncontrado.apellido,
        telefono: clienteEncontrado.telefono || '',
        email: clienteEncontrado.email || ''
      }))

      // Si el cliente viene de la URL, mostramos el mensaje y avanzamos automáticamente
      if (searchParams.get('dni') && paso === PASO_CLIENTE && !autoAvanzando) {
        setAutoAvanzando(true)
        setTimeout(() => {
          setPaso(PASO_PLAN)
          setAutoAvanzando(false)
        }, 1500) // 1.5s de feedback visual
      }
    } else {
      setFormulario(prev => ({
        ...prev,
        clienteId: null,
      }))
    }
  }, [clienteEncontrado, searchParams, paso, autoAvanzando])

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'dni') {
      setDni(value)
    } else {
      setFormulario(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSiguientePaso1 = (e) => {
    e.preventDefault()
    if (!formulario.nombre || !formulario.apellido || !formulario.dni) return
    setPaso(PASO_PLAN)
  }

  const handleSiguientePaso2 = () => {
    if (!formulario.planId) return
    // Sincronizar el monto sugerido del paso 3 con el precio del plan seleccionado
    const planSeleccionado = planes.find(p => p.id === formulario.planId)
    if (planSeleccionado) {
      setFormulario(prev => ({ ...prev, monto: planSeleccionado.precio }))
    }
    setPaso(PASO_PAGO)
  }

  const handleSubmit = async () => {
    setEnviando(true)
    try {
      let payload
      
      // Modo B: Cliente existente
      if (formulario.clienteId) {
        payload = {
          clienteId: formulario.clienteId,
          planId: formulario.planId,
          medioPago: formulario.medioPago,
          monto: Number(formulario.monto),
          fechaInicio: formulario.fechaInicio ? new Date(formulario.fechaInicio).toISOString() : undefined
        }
      } 
      // Modo A: Cliente nuevo
      else {
        payload = {
          clienteDatos: {
            nombre: formulario.nombre,
            apellido: formulario.apellido,
            dni: formulario.dni,
            telefono: formulario.telefono,
            email: formulario.email,
          },
          planId: formulario.planId,
          medioPago: formulario.medioPago,
          monto: Number(formulario.monto),
          fechaInicio: formulario.fechaInicio ? new Date(formulario.fechaInicio).toISOString() : undefined
        }
      }

      const respuesta = await inscribirClienteService(payload)
      
      toast.success('Inscripción completada exitosamente')
      
      // Redirigir al perfil del cliente (sea nuevo o existente)
      navigate(`/clientes/${respuesta.cliente.id}`)
      
    } catch (error) {
      // Si el error es 409 Conflict, el backend nos devuelve el cliente existente.
      // El interceptor global ya muestra un toast de error, pero además podemos 
      // autocompletar el wizard y volver al paso 1 para que el recepcionista lo vea.
      if (error.response?.status === 409 && error.response.data?.clienteExistente) {
        const existente = error.response.data.clienteExistente
        setFormulario(prev => ({
          ...prev,
          clienteId: existente.id,
          nombre: existente.nombre,
          apellido: existente.apellido,
          telefono: existente.telefono || '',
          email: existente.email || ''
        }))
        setPaso(PASO_CLIENTE) // Lo mandamos al paso 1 para que revise
        toast.info('Se recuperaron los datos del cliente existente.')
      }
      // Otros errores (500, 400, etc.) son manejados por el interceptor global
    } finally {
      setEnviando(false)
    }
  }

  // Cálculos para la previsualización de vencimiento en Paso 2
  const planSeleccionado = planes.find(p => p.id === formulario.planId)
  let fechaVencimientoPreview = null
  if (planSeleccionado && formulario.fechaInicio) {
    const inicio = new Date(formulario.fechaInicio)
    // Evitar desfase de zona horaria al crear desde un YYYY-MM-DD
    inicio.setMinutes(inicio.getMinutes() + inicio.getTimezoneOffset())
    const venc = new Date(inicio.getTime() + (planSeleccionado.duracionDias * 24 * 60 * 60 * 1000))
    fechaVencimientoPreview = venc
  }

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nueva Inscripción</h1>
        <p className="text-muted-foreground">Paso {paso} de 3</p>
      </div>

      <Card className="border-[#333333] bg-[#111111] shadow-xl">
        {paso === PASO_CLIENTE && (
          <form onSubmit={handleSiguientePaso1}>
            <CardHeader>
              <CardTitle className="text-xl">Datos del Cliente</CardTitle>
              <CardDescription>
                Ingresá el DNI para buscar si el cliente ya existe, o completá los datos para uno nuevo.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Input 
                    id="dni"
                    name="dni"
                    type="text"
                    required
                    value={dni}
                    onChange={handleInputChange}
                    placeholder="Ej: 35123456"
                    className="pl-10"
                    autoComplete="off"
                  />
                  {buscando ? (
                    <div className="absolute left-3 top-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  ) : (
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Alerta si el cliente ya existe */}
              {clienteEncontrado && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <UserCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-primary font-medium">Cliente encontrado</h4>
                      <p className="text-sm text-primary/80 mt-1">
                        {clienteEncontrado.nombre} {clienteEncontrado.apellido} ya está registrado en el sistema.
                      </p>
                    </div>
                  </div>
                  {autoAvanzando && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Continuando con la renovación...
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#333333]">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre <span className="text-primary">*</span></Label>
                  <Input 
                    id="nombre"
                    name="nombre"
                    required
                    value={formulario.nombre}
                    onChange={handleInputChange}
                    readOnly={Boolean(clienteEncontrado)}
                    className={clienteEncontrado ? "bg-[#1a1a1a] text-muted-foreground" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido <span className="text-primary">*</span></Label>
                  <Input 
                    id="apellido"
                    name="apellido"
                    required
                    value={formulario.apellido}
                    onChange={handleInputChange}
                    readOnly={Boolean(clienteEncontrado)}
                    className={clienteEncontrado ? "bg-[#1a1a1a] text-muted-foreground" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input 
                    id="telefono"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleInputChange}
                    readOnly={Boolean(clienteEncontrado)}
                    className={clienteEncontrado ? "bg-[#1a1a1a] text-muted-foreground" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={handleInputChange}
                    readOnly={Boolean(clienteEncontrado)}
                    className={clienteEncontrado ? "bg-[#1a1a1a] text-muted-foreground" : ""}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">
                  Siguiente paso
                </Button>
              </div>
            </CardContent>
          </form>
        )}

        {paso === PASO_PLAN && (
          <div>
            <CardHeader>
              <CardTitle className="text-xl">Plan y Membresía</CardTitle>
              <CardDescription>
                Seleccioná el plan a contratar y la fecha de inicio.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              
              {/* Fecha de Inicio */}
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Input 
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  value={formulario.fechaInicio}
                  onChange={handleInputChange}
                />
              </div>

              {/* Listado de Planes */}
              <div className="space-y-3">
                <Label>Seleccionar Plan</Label>
                {cargandoPlanes ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                  </div>
                ) : planes.length === 0 ? (
                  <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg">
                    No hay planes activos disponibles en el sistema.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {planes.map(plan => {
                      const seleccionado = formulario.planId === plan.id
                      return (
                        <div 
                          key={plan.id}
                          onClick={() => setFormulario(prev => ({ ...prev, planId: plan.id }))}
                          className={`
                            relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                            ${seleccionado 
                              ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(170,255,0,0.1)]' 
                              : 'border-[#333333] bg-[#1a1a1a] hover:border-primary/50'
                            }
                          `}
                        >
                          {seleccionado && (
                            <div className="absolute top-3 right-3 text-primary">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          )}
                          <h3 className={`font-semibold ${seleccionado ? 'text-primary' : 'text-white'}`}>
                            {plan.nombre}
                          </h3>
                          <div className="mt-2 text-2xl font-bold text-white">
                            {formatMoney(plan.precio)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Duración: {plan.duracionDias} días
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Previsualización del Vencimiento */}
              {planSeleccionado && fechaVencimientoPreview && (
                <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333333] flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de vencimiento calculada</p>
                    <p className="text-lg font-medium text-white">{formatDate(fechaVencimientoPreview)}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-[#333333]">
                <Button variant="ghost" onClick={() => setPaso(PASO_CLIENTE)}>
                  Atrás
                </Button>
                <Button onClick={handleSiguientePaso2} disabled={!formulario.planId}>
                  Siguiente paso
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {paso === PASO_PAGO && (
          <div>
            <CardHeader>
              <CardTitle className="text-xl">Pago y Confirmación</CardTitle>
              <CardDescription>
                Revisá el resumen y registrá el pago inicial.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              
              {/* Resumen de la operación */}
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333333] space-y-4">
                <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Resumen de Inscripción
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="font-medium text-white">{formulario.nombre} {formulario.apellido}</p>
                    <p className="text-xs text-muted-foreground">DNI: {formulario.dni}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plan Seleccionado</p>
                    <p className="font-medium text-white">{planSeleccionado?.nombre}</p>
                    <p className="text-xs text-muted-foreground">{planSeleccionado?.duracionDias} días</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha de Inicio</p>
                    <p className="font-medium text-white">{formatDate(formulario.fechaInicio)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vencimiento</p>
                    <p className="font-medium text-white">{fechaVencimientoPreview ? formatDate(fechaVencimientoPreview) : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Formulario de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto a cobrar (ARS) <span className="text-primary">*</span></Label>
                  <Input 
                    id="monto"
                    name="monto"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formulario.monto}
                    onChange={handleInputChange}
                    className="text-lg font-semibold"
                  />
                  {planSeleccionado && Number(formulario.monto) !== Number(planSeleccionado.precio) && (
                    <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      El monto difiere del precio del plan ({formatMoney(planSeleccionado.precio)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medioPago">Medio de Pago <span className="text-primary">*</span></Label>
                  <select
                    id="medioPago"
                    name="medioPago"
                    value={formulario.medioPago}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-[#333333] bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="debito">Tarjeta de Débito</option>
                    <option value="credito">Tarjeta de Crédito</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-[#333333]">
                <Button variant="ghost" onClick={() => setPaso(PASO_PLAN)} disabled={enviando}>
                  Atrás
                </Button>
                <Button onClick={handleSubmit} disabled={enviando} className="min-w-[150px]">
                  {enviando ? <Skeleton className="h-4 w-20 rounded-full" /> : 'Confirmar Inscripción'}
                </Button>
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  )
}
