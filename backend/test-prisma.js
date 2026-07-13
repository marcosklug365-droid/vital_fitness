import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    });

    const prisma = new PrismaClient({ adapter });

    try {
        console.log("Intentando crear recepcionista...");
        const result = await prisma.usuario.create({
            data: {
                nombre: "Test",
                apellido: "Test",
                email: `test_${Date.now()}@test.com`,
                password: "123",
                rol: "recepcionista",
                activo: true
            }
        });
        console.log("ÉXITO:", result);
    } catch (error) {
        console.error("ERROR AL CREAR:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
