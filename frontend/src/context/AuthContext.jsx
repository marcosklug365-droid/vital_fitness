import { createContext, useState, useContext } from "react";
import axios from "axios";

// 1. Creamos el contexto vacío
// Esto es como crear la "variable global" para guardar y compartir datos
const AuthContext = createContext();

// 2. AuthProvider es el componente que envuelve toda la aplicacion
// Y hace que los datos esten disponibles para todos los componentes hijos
export function AuthProvider({children}) {
    // useState con función de inicialización
    // Cuando la app arranca, busca el localStorage si hay datos guardados
    // Así el usuario no pierde la seseión si recarga la página 
    const [usuario, setUsuario] = useState(() => {
        const guardado = localStorage.getItem('usuario')
        return guardado ? JSON.parse(guardado) : null
    })

    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null
    })

    // Esta función se llama cuando el login es exitoso
    // Guarda los datos en memoria (useState) y en localStorage
    const login = (datosUsuario, tokenJWT) => {
        setUsuario(datosUsuario)
        setToken(tokenJWT)
        localStorage.setItem('usuario', JSON.stringify(datosUsuario))
        localStorage.setItem('token', tokenJWT)
    }

    // Esta función se llama cuando el usuario cierra sesión
    // Borra todo de memoria y de localStorage
    const logout = () => {
        setUsuario(null)
        setToken(null)
        localStorage.removeItem('usuario')
        localStorage.removeItem('token')
    }

    // value es lo que van a poder leer todos los componentes
    return (
        <AuthContext.Provider value={{ usuario, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook personalizado para usar el contexto más fácilmente
// En lugar de escribir useContext(AuthContext) en cada componente
// Simplemente escribís useAuth()
export function useAuth() {
    return useContext(AuthContext)
}