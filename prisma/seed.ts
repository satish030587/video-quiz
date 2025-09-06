// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPass = process.env.ADMIN_PASSWORD || "ChangeMe_Admin123!";
  const empEmail = process.env.EMP_EMAIL || "alex@example.com";
  const empPass = process.env.EMP_PASSWORD || "ChangeMe_User123!";

  const adminHash = await bcrypt.hash(adminPass, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Sam Admin",
      role: Role.ADMIN,
      passwordHash: adminHash,
      emailVerifiedAt: new Date(),
    }
  });

  const empHash = await bcrypt.hash(empPass, 10);
  await prisma.user.upsert({
    where: { email: empEmail },
    update: {},
    create: {
      email: empEmail,
      name: "Alex Employee",
      role: Role.EMPLOYEE,
      passwordHash: empHash,
      emailVerifiedAt: new Date(),
    }
  });

  // Idempotent module + quiz seed: create if missing, otherwise no-op
  const existingModule = await prisma.module.findUnique({ where: { order: 1 }, include: { quiz: { include: { questions: true } } } });
  if (!existingModule) {
    await prisma.module.create({
      data: {
        order: 1,
        title: "Intro to Safety",
        description: "First module description",
        youtubeId: "dQw4w9WgXcQ",
        quiz: {
          create: {
            passScore: 70,
            questions: {
              create: [
                { text: "What is safety?", options: ["Option1","Option2"], correctIndex: 0 },
                { text: "Who is responsible?", options: ["Everyone","Nobody"], correctIndex: 0 }
              ]
            }
          }
        }
      }
    });
  }

  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
