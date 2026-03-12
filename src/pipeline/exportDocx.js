import fs from "node:fs";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
  });
}

function heading(text, level) {
  return new Paragraph({
    text,
    heading: level,
  });
}

function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
  });
}

function kvTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({ children: [p(k, { bold: true })] }),
            new TableCell({ children: [p(v)] }),
          ],
        }),
    ),
  });
}

export async function exportDocx({ outPath, lang, copy, requirements }) {
  const n = requirements.extractedNumbers;

  const title =
    copy?.title ??
    (lang === "zh" ? "江门市中心医院旗舰标杆：投资提案摘要" : "Flagship Blueprint: Investment Proposal Summary");
  const subtitle =
    copy?.subtitle ??
    (lang === "zh"
      ? "面向全球高层的5分钟版本（宣传手册）"
      : "Executive handout (5-minute narrative)");

  const summary =
    copy?.executive_summary ??
    (lang === "zh"
      ? "（待生成）"
      : "(Pending generation)");

  const keyPoints = copy?.key_points ?? requirements.presentation.promoCopyMustInclude.map((x) => x);

  const cta =
    copy?.cta ??
    (lang === "zh"
      ? "建议：批准下一阶段投资，用于在更多旗舰医院复制该模式。"
      : "Recommendation: approve next-phase investment to scale this blueprint across flagship hospitals.");

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title, bold: true, size: 36 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: subtitle, size: 22, color: "666666" })],
          }),
          new Paragraph({ text: "" }),

          heading(lang === "zh" ? "一页关键数据" : "Key facts at a glance", HeadingLevel.HEADING_2),
          kvTable([
            [lang === "zh" ? "床位" : "Beds", `${n.bedsAuthorized} authorized (${n.bedsOperational} operational)`],
            [lang === "zh" ? "2024门诊" : "2024 outpatient visits", n.outpatientVisits2024],
            [lang === "zh" ? "2024出院" : "2024 discharges", n.discharges2024],
            [lang === "zh" ? "2024手术" : "2024 surgeries", n.surgeries2024],
            [lang === "zh" ? "危重占比" : "Severe/critical", n.severeCriticalPct],
            [lang === "zh" ? "高难手术" : "Tier 3–4 surgeries", n.tier34SurgeryPct],
            [lang === "zh" ? "CT覆盖" : "CT fleet", `${n.ctUnits} CT + ${n.nuclearCtUnits} Nuclear CT`],
            [lang === "zh" ? "运营规模" : "Daily operations", `${n.ctPatientsDaily} CT patients; ${n.dataPointsDaily} data points`],
            [lang === "zh" ? "月度用量" : "Monthly consumption", `${n.ctContrastBottlesMonthly} CT contrast; ${n.mrContrastBottlesMonthly} MR contrast; ${n.primovistBottlesMonthly} Primovist`],
            [lang === "zh" ? "月度耗材" : "Monthly consumables", `${n.ctSetsMonthly} CT sets; ${n.mrSetsMonthly} MR sets`],
            [lang === "zh" ? "合作周期" : "Partnership", `${n.partnershipMonths} months since ${n.partnershipStart}`],
          ]),

          new Paragraph({ text: "" }),
          heading(lang === "zh" ? "执行摘要" : "Executive summary", HeadingLevel.HEADING_2),
          new Paragraph({
            children: [new TextRun({ text: summary, size: 22 })],
          }),

          new Paragraph({ text: "" }),
          heading(lang === "zh" ? "要点" : "Key points", HeadingLevel.HEADING_2),
          ...keyPoints.map((kp) => bullet(kp)),

          new Paragraph({ text: "" }),
          heading(lang === "zh" ? "行动号召" : "Call to action", HeadingLevel.HEADING_2),
          new Paragraph({
            children: [new TextRun({ text: cta, bold: true })],
          }),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
}
