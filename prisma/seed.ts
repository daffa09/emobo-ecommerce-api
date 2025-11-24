import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync("admin123", 8);
  await prisma.user.upsert({
    where: { email: "admin@emobo.local" },
    update: {},
    create: { email: "admin@emobo.local", passwordHash: hash, name: "Admin", role: "ADMIN" },
  });
  console.log("seed done");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
