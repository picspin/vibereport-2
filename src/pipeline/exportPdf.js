import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

export async function exportPdf({ htmlPath, pdfPath }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1700 } });

  const fileUrl = new URL(`file://${path.resolve(htmlPath)}`).toString();
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  const pdfBuffer = await page.pdf({
    printBackground: true,
    format: "A4",
    preferCSSPageSize: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    scale: 1,
  });

  await browser.close();

  fs.writeFileSync(pdfPath, pdfBuffer);
}
