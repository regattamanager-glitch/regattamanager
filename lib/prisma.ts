import { PrismaClient } from '@prisma/client'

// Wir stellen sicher, dass DATABASE_URL im Prozess existiert, 
// damit Prisma 7 sie automatisch aus der Umgebung zieht.
const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma