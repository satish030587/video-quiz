import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

async function main() {
  console.log("Seeding sample main modules, sub-modules and questions...");

  // Sample topics
  const topics = [
    "WordPress step-by-step in XAMPP",
    "Windows 10 Installation",
    "Linux Basics",
    "Networking 101",
    "Security Fundamentals",
  ];

  // Create 5 main modules
  const mains: any[] = [];
  for (let i = 0; i < 5; i++) {
    const m = await (prisma as any).mainModule.create({
      data: {
        orderIndex: i + 1,
        title: `${i + 1}. ${topics[i]}`,
        description: `${topics[i]} - overview and resources`,
        youtubeId: "dQw4w9WgXcQ",
        isActive: true,
      },
    });
    mains.push(m);
    console.log(`Created MainModule ${m.id} (${m.title})`);
  }

  // ensure we don't collide with existing Module.order values
  const maxOrderRes = await (prisma as any).module.aggregate({ _max: { order: true } });
  let nextOrderStart = (maxOrderRes._max?.order ?? 0) + 1;
  for (let j = 0; j < 6; j++) {
    const parent = mains[j % mains.length];
    const subIndex = j + 1;
    // prepare 5 MCQ questions for this sub-module
    const questionsData = [];
    for (let q = 0; q < 5; q++) {
      const correct = randInt(4);
      questionsData.push({
        text: `Q${subIndex}.${q + 1}: What is the correct answer for sample question ${q + 1}?`,
        // using options array (4 choices)
        options: [
          `Option A for ${subIndex}.${q + 1}`,
          `Option B for ${subIndex}.${q + 1}`,
          `Option C for ${subIndex}.${q + 1}`,
          `Option D for ${subIndex}.${q + 1}`,
        ],
        correctIndex: correct,
        active: true,
      });
    }

    const created = await (prisma as any).module.create({
      data: {
        // use unique order values starting after existing max
        order: nextOrderStart + j,
        title: `Sub-module ${subIndex} - ${parent.title}`,
        description: `Hands-on exercises and quiz for ${parent.title}`,
        youtubeId: "dQw4w9WgXcQ",
        mainModuleId: parent.id,
        orderWithinMain: Math.floor(j / mains.length) + 1,
        quiz: {
          create: {
            passScore: 70,
            timeLimitSeconds: 300,
            questions: {
              create: questionsData,
            },
          },
        },
      },
      include: { quiz: { include: { questions: true } } },
    });

    console.log(`Created Module ${created.id} with Quiz ${created.quiz?.id} and ${created.quiz?.questions?.length ?? 0} questions`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });