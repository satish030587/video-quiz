import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMainModuleProgress } from "@/lib/quiz";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  const mainModuleId = Number(id);
  
  // Get this specific main module's progress
  const progress = await getMainModuleProgress(session.user.id);
  const mainModule = progress.find(m => m.id === mainModuleId);
  
  if (!mainModule) {
    return NextResponse.json({ message: "Main module not found" }, { status: 404 });
  }
  
  return NextResponse.json({
    id: mainModule.id,
    title: mainModule.title,
    completed: mainModule.completed,
    dashboardAverage: mainModule.dashboardAverage,
    nextSubmodule: mainModule.nextOpenSubModuleId 
      ? { id: mainModule.nextOpenSubModuleId, title: mainModule.nextOpenSubModuleTitle }
      : null
  });
}