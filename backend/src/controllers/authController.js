import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

// LOGIN
export const login = async (req, res) => {
    try {

        // Extraemos email y contraseña del cuerpo de la petición
        const { email, password } = req.body;

        // Validacion básica: verificamos que llegaron los datos
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscamos el usuario en la base de datos por su email
        // findUnique busca exactamente un usuario con ese email
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        // Si no existe un usuario con ese email, rechazamos la petición
        // Importante: No decimos "Email incorrecto" sino "Credenciales incorrectas"
        // para no dar pistas a posibles atacantes sobre qué parte de las credenciales es incorrecta
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Verificamos que el usuario esté activo 
        if (!usuario.activo) {
            return res.status(403).json({ error: 'Usuario inactivo, contacta al administrador' });
        }

        // bcrypt.compare compara la contraseña que llegó con el hash que está guardado en la base de datos
        // Devuelve true si coinciden, false si no
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Si llegamos hasta acá, email y contraseña son correctos
        // Generamos el token JWT con los datos del usuario
        // El token expira en 8 horas (una jornada laboral)
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Respondemos con el token y los datos básicos del usuario
        // Nunca incluimos la contraseña en la respuesta
        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol
            }
        })

    } catch (error) {
        console.error('Error en login: ', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// OBTENER PERFIL DEL USUARIO LOGUEADO
export const getPerfil = async (req, res) => {
    try {
        // req.usuario viene en el middleware verificarToken
        // Contiene el id y rol del usuario logueado
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.usuario.id },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                rol: true,
                activo: true,
                creadoEn: true
                // password: false -> nunca lo incluimos
            }
        })

        res.json(usuario)

    } catch (error) {
        console.error('Error al obtener perfil: ', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}