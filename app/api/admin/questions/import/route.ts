import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = {
  question_type: string;
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  sub_module_id?: string | number;
  module_id?: string;
};

function parseCsv(content: string): Row[] {
  const rows: Row[] = [];
  // Simple CSV parser handling quotes and commas
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return rows;
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    const obj: any = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = parts[j] ?? "";
    rows.push(obj as Row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else { cur += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { out.push(cur); cur = ""; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ message: "Expected multipart/form-data" }, { status: 400 });
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ message: "CSV file required" }, { status: 400 });
  const text = await (file as File).text();
  const rows = parseCsv(text);
  if (rows.length === 0) return NextResponse.json({ message: "Empty CSV" }, { status: 400 });

  let total = 0, ok = 0, fail = 0;
  const errors: string[] = [];
  const createdIds: string[] = [];

  for (const row of rows) {
    total++;
    try {
      const t = (row.question_type || "").trim().toUpperCase();
      if (!t) throw new Error(`Row ${total}: question_type is required`);
      const text = (row.question_text || "").trim();
      if (!text) throw new Error(`Row ${total}: question_text is required`);
      const moduleId = (row.module_id as string) || String(row.sub_module_id || "").trim();
      if (!moduleId) throw new Error(`Row ${total}: module_id/sub_module_id is required`);
      const mod = await prisma.module.findUnique({ where: { id: moduleId } });
      if (!mod) throw new Error(`Row ${total}: module ${moduleId} not found`);
      const quiz = await prisma.quiz.upsert({ where: { moduleId: mod.id }, create: { moduleId: mod.id, passScore: 70 }, update: {} });

      let options: string[] = [];
      let correctIndex = 0;

      if (t === "MCQ_4") {
        const a = (row.option_a || "").trim(); const b = (row.option_b || "").trim(); 
        const c = (row.option_c || "").trim(); const d = (row.option_d || "").trim();
        const ans = (row.correct_answer || "").trim().toUpperCase();
        
        // Improved validation with specific error messages
        if (!a) throw new Error(`Row ${total}: MCQ_4 requires option_a`);
        if (!b) throw new Error(`Row ${total}: MCQ_4 requires option_b`);
        if (!c) throw new Error(`Row ${total}: MCQ_4 requires option_c`);
        if (!d) throw new Error(`Row ${total}: MCQ_4 requires option_d`);
        
        if (!["A","B","C","D"].includes(ans)) {
          throw new Error(`Row ${total}: correct_answer must be A, B, C, or D (received: ${ans || "empty"})`);
        }
        
        options = [a,b,c,d];
        correctIndex = { A:0,B:1,C:2,D:3 }[ans as "A"|"B"|"C"|"D"] as number;
        const q = await prisma.question.create({ 
          data: { 
            quizId: quiz.id, 
            text, 
            options, 
            correctIndex, 
            questionType: "MCQ_4", 
            optionA: a, 
            optionB: b, 
            optionC: c, 
            optionD: d, 
            correctAnswer: ans 
          } 
        });
        createdIds.push(q.id);
      } else if (t === "MCQ_2") {
        const a = (row.option_a || "").trim(); const b = (row.option_b || "").trim();
        const ans = (row.correct_answer || "").trim().toUpperCase();
        
        // Improved validation with specific error messages
        if (!a) throw new Error(`Row ${total}: MCQ_2 requires option_a`);
        if (!b) throw new Error(`Row ${total}: MCQ_2 requires option_b`);
        
        if (!["A","B"].includes(ans)) {
          throw new Error(`Row ${total}: correct_answer for MCQ_2 must be A or B (received: ${ans || "empty"})`);
        }
        
        options = [a,b];
        correctIndex = { A:0,B:1 }[ans as "A"|"B"] as number;
        const q = await prisma.question.create({ 
          data: { 
            quizId: quiz.id, 
            text, 
            options, 
            correctIndex, 
            questionType: "MCQ_2", 
            optionA: a, 
            optionB: b, 
            correctAnswer: ans 
          } 
        });
        createdIds.push(q.id);
      } else if (t === "TRUE_FALSE" || t === "TRUEFALSE" || t === "TRUE/FALSE") {
        const ans = (row.correct_answer || "").trim().toUpperCase();
        
        if (!["TRUE","FALSE"].includes(ans)) {
          throw new Error(`Row ${total}: correct_answer for TRUE_FALSE must be TRUE or FALSE (received: ${ans || "empty"})`);
        }
        
        options = ["TRUE","FALSE"]; 
        correctIndex = ans === "TRUE" ? 0 : 1;
        const q = await prisma.question.create({ 
          data: { 
            quizId: quiz.id, 
            text, 
            options, 
            correctIndex, 
            questionType: "TRUE_FALSE", 
            correctAnswer: ans 
          } 
        });
        createdIds.push(q.id);
      } else {
        throw new Error(`Row ${total}: unsupported question_type '${row.question_type}'. Must be MCQ_4, MCQ_2, or TRUE_FALSE.`);
      }
      ok++;
    } catch (e: any) {
      fail++;
      errors.push(e?.message || String(e));
    }
  }

  // Record import summary
  try {
    await prisma.questionImport.create({ 
      data: { 
        uploadedById: session.user.id, 
        fileName: (form.get("file") as File)?.name || "upload.csv", 
        totalQuestions: total, 
        successfulImports: ok, 
        failedImports: fail, 
        errorLog: errors.join("\n").slice(0, 8000) 
      } 
    });
  } catch (error) {
    console.error("Failed to record import summary:", error);
  }

  // Return detailed response
  return NextResponse.json({ 
    total, 
    imported: ok, 
    failed: fail, 
    errors: errors.slice(0, 10), // First 10 errors for UI display
    hasMoreErrors: errors.length > 10,
    totalErrors: errors.length,
    createdIds 
  });
}

