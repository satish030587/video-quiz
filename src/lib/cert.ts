import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export function ensureCertificatesDir() {
  const dir = path.join(process.cwd(), "public", "certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function generateCertificatePdf({
  userName,
  userEmail,
  overallScore,
}: { userName: string; userEmail: string; overallScore: number }) {
  const dir = ensureCertificatesDir();
  const fileName = `${userEmail.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
  const filePath = path.join(dir, fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(24).text("Certificate of Completion", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Awarded to: ${userName}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Overall Score: ${overallScore}%`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });

    doc.moveDown(2);
    doc.fontSize(10).text("Congratulations on successfully completing the training.", { align: "center" });

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return filePath;
}

