import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as QR from "qrcode";

export function ensureCertificatesDir() {
  const dir = path.join(process.cwd(), "public", "certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function brand() {
  return {
    primary: { r: 0x14 / 255, g: 0x6A / 255, b: 0x5A / 255 }, // #146A5A
    accent: { r: 0xE0 / 255, g: 0x8E / 255, b: 0x21 / 255 },  // #E08E21
    text: { r: 0x0F / 255, g: 0x17 / 255, b: 0x2A / 255 },    // #0F172A
    slate: { r: 0x47 / 255, g: 0x55 / 255, b: 0x69 / 255 },   // #475569
    gray: { r: 0x64 / 255, g: 0x74 / 255, b: 0x8B / 255 },    // #64748B
    line: { r: 0x94 / 255, g: 0xA3 / 255, b: 0xB8 / 255 },    // #94A3B8
  };
}

export async function generateCertificatePdf({
  userName,
  userEmail,
  overallScore,
}: { userName: string; userEmail: string; overallScore: number }) {
  const dir = ensureCertificatesDir();
  const safe = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(dir, `${safe}.pdf`);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const colors = brand();

  // Fonts
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header band
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(colors.primary.r, colors.primary.g, colors.primary.b) });
  page.drawText("Sarvahitha Ayurvedalaya Pvt Ltd", { x: 56, y: height - 48, size: 14, font: fontReg, color: rgb(1,1,1) });

  // Border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: rgb(colors.primary.r, colors.primary.g, colors.primary.b), borderWidth: 2 });

  // Title
  const title = "Certificate of Completion";
  const titleSize = 28;
  page.drawText(title, { x: (width - fontBold.widthOfTextAtSize(title, titleSize)) / 2, y: height - 160, size: titleSize, font: fontBold, color: rgb(colors.text.r, colors.text.g, colors.text.b) });

  // Subtitle
  const sub = "This is to certify that";
  page.drawText(sub, { x: (width - fontReg.widthOfTextAtSize(sub, 12)) / 2, y: height - 190, size: 12, font: fontReg, color: rgb(colors.slate.r, colors.slate.g, colors.slate.b) });

  // Name
  const name = userName || userEmail;
  page.drawText(name, { x: (width - fontBold.widthOfTextAtSize(name, 22)) / 2, y: height - 220, size: 22, font: fontBold, color: rgb(colors.primary.r, colors.primary.g, colors.primary.b) });

  // Details
  const lines = [
    `Email: ${userEmail}`,
    `Overall Score: ${overallScore}%`,
    `Date: ${new Date().toLocaleDateString()}`,
  ];
  let y = height - 260;
  for (const l of lines) {
    page.drawText(l, { x: (width - fontReg.widthOfTextAtSize(l, 12)) / 2, y, size: 12, font: fontReg, color: rgb(colors.text.r, colors.text.g, colors.text.b) });
    y -= 16;
  }

  // Divider
  page.drawLine({ start: { x: 120, y: 320 }, end: { x: width - 120, y: 320 }, thickness: 2, color: rgb(colors.accent.r, colors.accent.g, colors.accent.b) });

  // Footer text
  const congrats = "Congratulations on successfully completing the training.";
  page.drawText(congrats, { x: (width - fontReg.widthOfTextAtSize(congrats, 10)) / 2, y: 180, size: 10, font: fontReg, color: rgb(colors.gray.r, colors.gray.g, colors.gray.b) });

  // QR (optional)
  try {
    const qrData = await QR.toDataURL(`Certificate for ${userEmail} | Score ${overallScore}% | ${new Date().toISOString().slice(0,10)}`, { margin: 1, width: 160 });
    const png = await pdfDoc.embedPng(Buffer.from(qrData.split(",")[1] || "", "base64"));
    const w = 96;
    const h = (png.height / png.width) * w;
    page.drawImage(png, { x: width - 56 - w, y: 150, width: w, height: h });
  } catch {}

  // Signature line
  page.drawLine({ start: { x: 56, y: 150 }, end: { x: 200, y: 150 }, thickness: 1, color: rgb(colors.line.r, colors.line.g, colors.line.b) });
  page.drawText("Authorized Signature", { x: 56, y: 136, size: 10, font: fontReg, color: rgb(colors.slate.r, colors.slate.g, colors.slate.b) });

  const bytes = await pdfDoc.save();
  fs.writeFileSync(filePath, Buffer.from(bytes));
  return filePath;
}

