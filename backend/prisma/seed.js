import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {

  // ─── 1. Usuario dueño (ya lo tenías) ──────────────
  const passwordHashDueno = await bcrypt.hash('admin123', 10)

  const dueno = await prisma.usuario.upsert({
    where: { email: 'admin@vitalfitness.com' },
    update: {},
    create: {
      nombre: 'Admin',
      apellido: 'Vital Fitness',
      email: 'admin@vitalfitness.com',
      password: passwordHashDueno,
      rol: 'dueno',
      activo: true
    }
  })
  console.log('✅ Usuario dueño:', dueno.email)

  // ─── 2. Usuario entrenador (NUEVO) ──────────────
  const passwordHashEntrenador = await bcrypt.hash('entrenador123', 10)

  const entrenador = await prisma.usuario.upsert({
    where: { email: 'entrenador@vitalfitness.com' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'García',
      email: 'entrenador@vitalfitness.com',
      password: passwordHashEntrenador,
      rol: 'entrenador',
      activo: true
    }
  })
  console.log('✅ Usuario entrenador:', entrenador.email, '— contraseña: entrenador123')

  // ─── 3. Buscamos el primer cliente que exista ──────────────
  // findFirst trae el primer registro que cumpla la condición
  // (en este caso no ponemos condición, así que trae el primero que haya)
  let cliente = await prisma.cliente.findFirst({
    orderBy: { id: 'asc' }
  })

  if (!cliente) {
    console.log('⚠️ No hay ningún cliente creado todavía. Creando uno de prueba...')
    cliente = await prisma.cliente.create({
      data: {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan.perez@example.com',
        telefono: '1122334455',
        activo: true
      }
    })
  }
  console.log('ℹ️  Usando cliente:', cliente.nombre, cliente.apellido)

  // ─── 4. Crear un plan (NUEVO) ──────────────
  const plan = await prisma.plan.upsert({
    where: { id: 1 }, // si no existe el id 1, lo crea
    update: {},
    create: {
      nombre: 'Mensual',
      descripcion: 'Acceso completo al gimnasio durante 30 días corridos.',
      precio: 8000,
      duracionDias: 30,
      activo: true
    }
  })
  console.log('✅ Plan creado:', plan.nombre)

  // ─── 5. Crear una membresía para ese cliente (NUEVO) ──────────────
  const hoy = new Date()
  const fechaVencimiento = new Date()
  fechaVencimiento.setDate(hoy.getDate() + plan.duracionDias)

  const membresia = await prisma.membresia.create({
    data: {
      clienteId: cliente.id,
      planId: plan.id,
      fechaInicio: hoy,
      fechaVencimiento: fechaVencimiento,
      estado: 'activa'
    }
  })
  console.log('✅ Membresía creada para', cliente.nombre, '— vence el', fechaVencimiento.toLocaleDateString('es-AR'))

  // ─── 6. Crear un pago asociado a esa membresía (NUEVO) ──────────────
  const pago = await prisma.pago.create({
    data: {
      clienteId: cliente.id,
      membresiaId: membresia.id,
      monto: plan.precio,
      medioPago: 'efectivo',
      fechaPago: hoy,
      observaciones: 'Pago de prueba generado por seed'
    }
  })
  console.log('✅ Pago registrado:', pago.monto, '— medio:', pago.medioPago)

  // ─── 7. Crear una clase de prueba (NUEVO) ──────────────
  const clase = await prisma.clase.upsert({
    where: { id: 1 },
    update: {
      nombre: 'Musculación',
      descripcion: 'Entrenamiento con pesas y máquinas.',
      instructorId: entrenador.id,
      diaSemana: 'lunes',
      horaInicio: '08:00',
      horaFin: '09:00',
      capacidadMaxima: 20,
      activa: true
    },
    create: {
      nombre: 'Musculación',
      descripcion: 'Entrenamiento con pesas y máquinas.',
      instructorId: entrenador.id,
      diaSemana: 'lunes',
      horaInicio: '08:00',
      horaFin: '09:00',
      capacidadMaxima: 20,
      activa: true
    }
  })
  console.log('✅ Clase creada:', clase.nombre, '— instructor:', entrenador.nombre)

  // ─── 8. Crear una asistencia (entrada y salida) (NUEVO) ──────────────
  // Simulamos que entró hace 1 hora y salió hace 10 minutos
  const fechaEntrada = new Date()
  fechaEntrada.setHours(fechaEntrada.getHours() - 1)

  const fechaSalida = new Date()
  fechaSalida.setMinutes(fechaSalida.getMinutes() - 10)

  const asistencia = await prisma.asistencia.create({
    data: {
      claseId: clase.id,
      clienteId: cliente.id,
      registradoPor: entrenador.id, // quedó registrada por el entrenador
      fechaEntrada: fechaEntrada,
      fechaSalida: fechaSalida
    }
  })
  console.log('✅ Asistencia registrada — entrada:', fechaEntrada.toLocaleTimeString('es-AR'), 'salida:', fechaSalida.toLocaleTimeString('es-AR'))

  console.log('')
  console.log('🎉 Seed completo. Datos de prueba listos.')
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error)
  })
  .finally(() => prisma.$disconnect())