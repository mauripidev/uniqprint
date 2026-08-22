import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.AMBIENTE === "development" ? ["error", "warn"] : ["error"]
});
