import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL, // Prisma v7 erwartet hier nur url
    // shadowDatabaseUrl?: process.env.SHADOW_DATABASE_URL, falls benötigt
  },
});