import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { getAforoService } from '../services/asistenciasService'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'

export function useAforo() {
  const [aforo, setAforo] = useState({ ocupados: 0, capacidadMaxima: 12, clientesDentro: [] })
  const [cargando, setCargando] = useState(true)
  const [ultimoEvento, setUltimoEvento] = useState(null)

  // useRef guarda la conexión del socket sin causar re-renders cuando cambia
  // (a diferencia de useState, que sí provoca que el componente se vuelva a dibujar)
  const socketRef = useRef(null)

  useEffect(() => {
    // 1. Cargamos el aforo inicial por HTTP normal, como cualquier otro dato
    cargarAforoInicial()

    // 2. Abrimos la conexión de Socket.io
    socketRef.current = io(SOCKET_URL)

    // 3. Escuchamos el evento 'aforo-actualizado' que el backend emite
    //    cada vez que alguien entra o sale
    socketRef.current.on('aforo-actualizado', (data) => {
      console.log('⚡ Aforo actualizado en tiempo real:', data)
      setUltimoEvento(data)
      // Volvemos a pedir el detalle completo (lista de clientes adentro)
      // porque el evento solo nos manda el número, no la lista completa
      cargarAforoInicial()
    })

    // 4. Cleanup: cuando el componente se desmonta (el usuario sale de la pantalla)
    //    cerramos la conexión para no dejarla abierta en el aire
    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  const cargarAforoInicial = async () => {
    try {
      const data = await getAforoService()
      setAforo(data)
    } catch (error) {
      console.error('Error al cargar aforo:', error)
    } finally {
      setCargando(false)
    }
  }

  return { aforo, cargando, ultimoEvento, recargar: cargarAforoInicial }
}