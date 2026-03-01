import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Wir nutzen 'any', um die strengen Prisma 7 Typen zu umgehen, 
  // damit der Vercel-Build die URL findet.
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  } as any)
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma