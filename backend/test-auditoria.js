import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    });
    const prisma = new PrismaClient({ adapter });

    try {
        console.log("Verificando existencia de AuditoriaAcceso en PrismaClient...");
        if (prisma.auditoriaAcceso) {
            console.log("✅ prisma.auditoriaAcceso EXISTE correctamente en el cliente actual.");
        } else {
            console.error("❌ prisma.auditoriaAcceso NO EXISTE en el cliente.");
        }
    } catch (error) {
        console.error("ERROR:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
