// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  // Nur beim ersten Aufruf instanziieren
  if (!global.prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL fehlt in der .env!');
    }
    global.prisma = new PrismaClient();
  }
  return global.prisma;
}