import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // engineType = "client" (see prisma/schema.prisma) runs the query compiler
  // as WASM inside Node and talks to Postgres through node-postgres, so there's
  // no native engine binary to load on a cold start. The pool lives for the
  // life of the function instance and is shared across concurrent requests
  // under Fluid Compute.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
