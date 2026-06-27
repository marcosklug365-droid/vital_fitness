import jwt from 'jsonwebtoken'

// Este middleware se encarga de verificar que el token JWT sea valido 
// Se va a usar en todas las rutas que requieran estar logueado para acceder
export const verificarToken = (req, res, next) => {
    try {

        // El token viene en el header Authorization con el formato "Bearer <token>"
        const authHeader = req.headers.authorization;

        // Si no hay header o no empieza con "Bearer ", rechazamos la petición
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        // Separamos "Bearer " del token real
        // "Bearer eyJhbGci..." => ["Bearer", "eyJhbGci..."]
        const token = authHeader.split(' ')[1];

        // jwt.verify verifica que el token sea valido y no haya expirado
        // Si es invalido lanza un error que atrapamos en el catch
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Guardamos los datos del usuario en req.usuario para que las rutas puedan acceder a ellos
        // Para que el controller pueda usarlos despues
        req.usuario = decoded;

        // next() le dice a Express que puede continuar al controller correspondiente
        next();

    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

// Este middleware se encarga de verificar que el usuario tenga el rol de dueño para acceder a ciertas rutas
// Se va a usar en las rutas que solo el dueño puede acceder, como crear entrenadores o eliminar usuarios
export const soloDueno = (req, res, next) => {
    if (req.usuario.rol !== 'dueno') {
        return res.status(403).json({
            error: 'Acceso denegado: solo el dueño puede realizar esta acción'
        })
    }
    next();
}