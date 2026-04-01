// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();  // ✅ no options

export default prisma;
