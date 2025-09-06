import { prisma } from "./prisma";

export type ModuleStatus = "LOCKED" | "PENDING" | "PASSED" | "FAILED";

export interface ModuleProgressItem {
  id: string;
  order: number;
  title: string;
  description: string | null;
  youtubeId: string;
  status: ModuleStatus;
  attemptsUsed: number;
  lastScore?: number | null;
  passScore: number;
}

export async function getModuleProgress(userId: string): Promise<ModuleProgressItem[]> {
  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    include: { quiz: true },
  });

  const attempts = await prisma.attempt.findMany({ where: { userId }, orderBy: { submittedAt: "asc" } });

  // Map of moduleId -> { attemptsUsed, lastScore, passed }
  const modStats = new Map<string, { attemptsUsed: number; lastScore: number | null; passed: boolean }>();
  const quizIdToModuleId = new Map<string, string>();
  for (const m of modules) {
    modStats.set(m.id, { attemptsUsed: 0, lastScore: null, passed: false });
    if (m.quiz) quizIdToModuleId.set(m.quiz.id, m.id);
  }
  for (const a of attempts) {
    const moduleId = quizIdToModuleId.get(a.quizId);
    if (!moduleId) continue;
    const s = modStats.get(moduleId) || { attemptsUsed: 0, lastScore: null, passed: false };
    s.attemptsUsed = Math.max(s.attemptsUsed, a.attemptNo);
    s.lastScore = a.score;
    s.passed = s.passed || a.passed;
    modStats.set(moduleId, s);
  }

  // Determine locking based on sequential rule
  let allPreviousPassed = true;
  const items: ModuleProgressItem[] = [];
  for (const m of modules) {
    const s = modStats.get(m.id)!;
    let status: ModuleStatus;
    if (s.passed) status = "PASSED";
    else if (!allPreviousPassed) status = "LOCKED";
    else if (s.attemptsUsed >= 2) status = "FAILED"; // failed twice
    else status = "PENDING";
    if (!s.passed) allPreviousPassed = false; // sequence requires pass to keep unlocking further
    items.push({
      id: m.id,
      order: m.order,
      title: m.title,
      description: m.description,
      youtubeId: m.youtubeId,
      status,
      attemptsUsed: s.attemptsUsed,
      lastScore: s.lastScore,
      passScore: m.quiz?.passScore ?? 70,
    });
  }
  return items;
}

export async function isModuleAccessible(userId: string, moduleId: string): Promise<boolean> {
  const progress = await getModuleProgress(userId);
  const target = progress.find((p) => p.id === moduleId);
  if (!target) return false;
  return target.status === "PENDING" || target.status === "PASSED"; // allow viewing video; quiz will check PENDING only
}

export async function canAttemptQuiz(userId: string, moduleId: string): Promise<{ allowed: boolean; reason?: string }>{
  const progress = await getModuleProgress(userId);
  const target = progress.find((p) => p.id === moduleId);
  if (!target) return { allowed: false, reason: "Module not found" };
  if (target.status === "LOCKED") return { allowed: false, reason: "Module is locked" };
  if (target.status === "PASSED") return { allowed: false, reason: "Already passed" };
  if (target.status === "FAILED") return { allowed: false, reason: "No attempts left" };
  // status === PENDING
  return { allowed: true };
}
