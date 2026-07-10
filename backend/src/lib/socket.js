import { Server } from 'socket.io'

// Variable que va a guardar la instancia de Socket.io una vez inicializada
let io = null

// Se llama una sola vez, desde index.js, cuando arranca el servidor
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' } // permite conexiones desde cualquier origen (en producción conviene restringirlo)
  })

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado vía socket:', socket.id)

    socket.on('disconnect', () => {
      console.log('🔌 Cliente desconectado:', socket.id)
    })
  })

  return io
}

// Cualquier controller puede llamar a esta función para obtener
// la instancia y emitir eventos
export const getIO = () => io