import pkg from "@prisma/client";

const { PrismaClient } = pkg;

const prisma = new PrismaClient({
  log: ["warn", "error"],
});

export default prisma;
