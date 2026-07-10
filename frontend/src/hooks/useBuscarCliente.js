import { useState, useEffect, useRef, useCallback } from 'react'
import { buscarClientePorDniService } from '../services/clientesService'

const DEBOUNCE_MS = 350 // Tiempo de espera antes de lanzar la búsqueda

/**
 * Hook para buscar un cliente por DNI con debounce.
 *
 * Evita saturar el backend con una petición por cada tecla presionada.
 * En su lugar, espera DEBOUNCE_MS ms desde la última tecla antes de buscar.
 *
 * @returns {Object}
 *   - dni:            string  — el valor actual del input de DNI
 *   - setDni:         fn      — actualiza el valor del DNI
 *   - clienteEncontrado: object | null — el cliente si existe en la BD, null si no
 *   - buscando:       bool    — true mientras la petición está en vuelo
 *   - limpiar:        fn      — resetea el estado del hook
 */
export function useBuscarCliente() {
  const [dni, setDni]                         = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [buscando, setBuscando]               = useState(false)
  const timerRef                              = useRef(null)

  const buscar = useCallback(async (valorDni) => {
    // Solo buscamos si el DNI tiene al menos 7 caracteres (DNI mínimo realista)
    if (!valorDni || valorDni.trim().length < 7) {
      setClienteEncontrado(null)
      return
    }

    setBuscando(true)
    try {
      const resultado = await buscarClientePorDniService(valorDni.trim())
      setClienteEncontrado(resultado) // null si no existe
    } catch {
      setClienteEncontrado(null)
    } finally {
      setBuscando(false)
    }
  }, [])

  useEffect(() => {
    // Cancelamos el timer anterior si el usuario sigue escribiendo
    if (timerRef.current) clearTimeout(timerRef.current)

    // Si el campo se vació, limpiamos el resultado sin hacer petición
    if (!dni.trim()) {
      setClienteEncontrado(null)
      return
    }

    // Esperamos DEBOUNCE_MS antes de ejecutar la búsqueda
    timerRef.current = setTimeout(() => {
      buscar(dni)
    }, DEBOUNCE_MS)

    // Cleanup: si el componente se desmonta o dni cambia de nuevo, cancelamos el timer
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [dni, buscar])

  const limpiar = useCallback(() => {
    setDni('')
    setClienteEncontrado(null)
    setBuscando(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { dni, setDni, clienteEncontrado, buscando, limpiar }
}
