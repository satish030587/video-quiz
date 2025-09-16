import { be } from "zod/locales";
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

export interface SubModuleProgressItem extends ModuleProgressItem {
  mainModuleId?: number | null;
  orderWithinMain?: number | null;
}

export interface MainModuleProgressItem {
  id: number;
  orderIndex: number;
  title: string;
  description: string | null;
  youtubeId: string;
  isActive: boolean;
  completed: boolean;
  subModules: SubModuleProgressItem[];
  // New fields
  nextOpenSubModuleId?: string;      // ID of the next pending sub-module
  nextOpenSubModuleTitle?: string;   // Title of the next pending sub-module
  dashboardAverage: number | null;   // Average score of attempted sub-modules (null if none attempted)
  averageForCertificate: number;     // Average score for certificate (includes 0 for unattempted)
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
  // Honor MainModule sequencing if the module is assigned to one
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) return false;
  if ((mod as any).mainModuleId) {
    const tree = await getMainModuleProgress(userId);
    const group = tree.find((g) => g.subModules.some((s) => s.id === moduleId));
    if (!group) return false;
    const item = group.subModules.find((s) => s.id === moduleId)!;
    return item.status === "PENDING" || item.status === "PASSED";
  }
  // Fallback to legacy global progression
  const progress = await getModuleProgress(userId);
  const target = progress.find((p) => p.id === moduleId);
  if (!target) return false;
  return target.status === "PENDING" || target.status === "PASSED";
}

export async function canAttemptQuiz(userId: string, moduleId: string): Promise<{ allowed: boolean; reason?: string }>{
  // Respect MainModule sequencing if applicable
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) return { allowed: false, reason: "Module not found" };
  if ((mod as any).mainModuleId) {
    const tree = await getMainModuleProgress(userId);
    const group = tree.find((g) => g.subModules.some((s) => s.id === moduleId));
    if (!group) return { allowed: false, reason: "Module not in sequence" };
    const item = group.subModules.find((s) => s.id === moduleId)!;
    if (item.status === "LOCKED") return { allowed: false, reason: "Module is locked" };
    if (item.status === "PASSED") return { allowed: false, reason: "Already passed" };
    if (item.status === "FAILED") return { allowed: false, reason: "No attempts left" };
    return { allowed: true };
  }
  // Legacy fallback
  const progress = await getModuleProgress(userId);
  const target = progress.find((p) => p.id === moduleId);
  if (!target) return { allowed: false, reason: "Module not found" };
  if (target.status === "LOCKED") return { allowed: false, reason: "Module is locked" };
  if (target.status === "PASSED") return { allowed: false, reason: "Already passed" };
  if (target.status === "FAILED") return { allowed: false, reason: "No attempts left" };
  return { allowed: true };
}

export async function getMainModuleProgress(userId: string): Promise<MainModuleProgressItem[]> {
  // Load main modules and their assigned sub-modules
  const mainModules = await (prisma as any).mainModule.findMany({ orderBy: { orderIndex: "asc" } });
  const assigned = await prisma.module.findMany({ where: { NOT: { mainModuleId: null as any } }, orderBy: [{ mainModuleId: "asc" as any }, { orderWithinMain: "asc" as any }] , include: { quiz: true } as any });
  const assignedByGroup = new Map<number, any[]>();
  for (const m of assigned as any[]) {
    const g = m.mainModuleId as number;
    const arr = assignedByGroup.get(g) || [];
    arr.push(m);
    assignedByGroup.set(g, arr);
  }
  // Attempts for this user
  const attempts = await prisma.attempt.findMany({ where: { userId }, orderBy: { submittedAt: "asc" } });
  
  // Build attempts grouped by quizId so we can compute: attemptsUsed (count), lastScore (latest), passed (any passed)
  const attemptsByQuiz = new Map<string, any[]>();
  for (const a of attempts) {
    const arr = attemptsByQuiz.get(a.quizId) || [];
    arr.push(a);
    attemptsByQuiz.set(a.quizId, arr);
  }
  
  
  const bestByQuiz = new Map<string, { attemptsUsed: number; lastScore: number | null; passed: boolean }>();
  for (const [quizId, arr] of attemptsByQuiz.entries()) {
    bestByQuiz.set(quizId, {
      attemptsUsed: arr.length,
      lastScore: arr[0]?.score ?? null,
      passed: arr.some((x) => !!x.passed),
    });
  }

  // Build groups enforcing sequential unlocking inside each group, and across groups
  const result: MainModuleProgressItem[] = [];
  let previousGroupCompleted = true;
  for (const g of mainModules as any[]) {
    const list = (assignedByGroup.get(g.id) || []) as any[];
    const subs: SubModuleProgressItem[] = [];
    let allPassed = true;
    let gateOpen = previousGroupCompleted; // open only if all prior groups completed
    
    // New variables to track next pending module and scores
    let nextPendingModule: { id: string; title: string } | undefined;
    let totalScoreForCert = 0;
    let totalAttemptsWithScores = 0;
    let totalModulesForCert = list.length;
    
    for (const m of list) {
      const q = m.quiz as any | null;
      const stat = q ? (bestByQuiz.get(q.id) || { attemptsUsed: 0, lastScore: null, passed: false }) : { attemptsUsed: 0, lastScore: null, passed: false };
      let status: ModuleStatus;
      if (stat.passed) status = "PASSED";
      else if (!gateOpen) status = "LOCKED";
      else if (stat.attemptsUsed >= 2) status = "FAILED";
      else status = "PENDING";
      
      // Track the first pending module in this group
      if (status === "PENDING" && !nextPendingModule) {
        nextPendingModule = { id: m.id, title: m.title };
      }
      
      // Track scores for certificate and dashboard
      if (stat.lastScore !== null) {
        totalScoreForCert += stat.lastScore;
        totalAttemptsWithScores++;
      }
      
      if (!stat.passed) { 
        gateOpen = false; 
        allPassed = false;
      }
      
      subs.push({ 
        id: m.id, 
        order: m.order, 
        title: m.title, 
        description: m.description, 
        youtubeId: m.youtubeId, 
        status, 
        attemptsUsed: stat.attemptsUsed, 
        lastScore: stat.lastScore, 
        passScore: q?.passScore ?? 70, 
        mainModuleId: g.id, 
        orderWithinMain: m.orderWithinMain 
      });
    }
    
    // Calculate dashboard average (null if no attempts)
    const dashboardAverage = totalAttemptsWithScores > 0 
      ? Math.round(totalScoreForCert / totalAttemptsWithScores)
      : null;
    
    // Calculate certificate average (0 for unattempted)
    const averageForCertificate = totalModulesForCert > 0
      ? Math.round(totalScoreForCert / totalModulesForCert)
      : 0;
    
    const completed = allPassed && list.length > 0;
    
    result.push({ 
      id: g.id, 
      orderIndex: g.orderIndex, 
      title: g.title, 
      description: g.description, 
      youtubeId: g.youtubeId, 
      isActive: g.isActive, 
      completed,
      subModules: subs,
      nextOpenSubModuleId: nextPendingModule?.id,
      nextOpenSubModuleTitle: nextPendingModule?.title,
      dashboardAverage,
      averageForCertificate
    });
    
    previousGroupCompleted = previousGroupCompleted && (allPassed || list.length === 0);
  }
  return result;
}
