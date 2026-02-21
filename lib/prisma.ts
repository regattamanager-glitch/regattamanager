// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // In v7 kann die URL hier direkt oder über die config gesteuert werden
    // Falls npx prisma generate immer noch meckert, stelle sicher, 
    // dass DATABASE_URL in deiner .env korrekt gesetzt ist.
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;