import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

function heading(text, level) {
  return new Paragraph({ text, heading: level });
}

function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })] });
}

function blank() {
  return new Paragraph({ text: "" });
}

function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function parseTextBlocks(text) {
  if (!text) return [];
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let paraBuf = [];

  const flushPara = () => {
    const t = paraBuf.join(" ").trim();
    if (t) out.push({ kind: "p", text: t });
    paraBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      continue;
    }

    const m = line.trim().match(/^[-*]\s+(.*)$/);
    if (m) {
      flushPara();
      out.push({ kind: "bullet", text: m[1].trim() });
      continue;
    }

    paraBuf.push(line.trim());
  }
  flushPara();
  return out;
}

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function simpleTable({ header, rows, widthsPct = null }) {
  const tableRows = [];

  if (header?.length) {
    tableRows.push(
      new TableRow({
        children: header.map((h) => new TableCell({ children: [p(h, { bold: true })] })),
      }),
    );
  }

  for (const r of rows) {
    tableRows.push(
      new TableRow({
        children: r.map((c) => new TableCell({ children: [p(c ?? "")] })),
      }),
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widthsPct ? widthsPct.map((w) => w) : undefined,
    rows: tableRows,
  });
}

function tryEmbedImage({ repoRoot, candidates, width = 640, height = 360, caption = null }) {
  for (const rel of candidates) {
    const abs = path.isAbsolute(rel) ? rel : path.join(repoRoot, rel);
    if (fs.existsSync(abs)) {
      const bytes = fs.readFileSync(abs);
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: bytes, transformation: { width, height } })],
        }),
        caption ? new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: caption, italics: true, color: "666666" })] }) : null,
      ].filter(Boolean);
    }
  }

  const label = caption ? caption : "Figure placeholder";
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `[${label} — insert image here]`, italics: true, color: "666666" }),
      ],
    }),
  ];
}

export async function exportProposalDocx({ outPath, proposal, requirements, repoRoot }) {
  const title = proposal?.title ?? "Scientific Proposal";
  const fx = proposal?.fx_assumption?.usd_to_rmb;
  const fxNote = proposal?.fx_assumption?.note;

  // Spec enforcement (fail fast / fail build)
  const requiredSectionIds = [
    "5.1",
    "5.2",
    "5.3",
    "5.4",
    "5.5",
    "5.6",
    "5.7",
    "5.8",
    "5.9",
    "5.10",
  ];

  const sections = Array.isArray(proposal?.sections) ? proposal.sections : [];
  const byId = new Map(sections.map((s) => [String(s?.id ?? ""), s]));
  const missing = requiredSectionIds.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new Error(
      `Proposal sections missing required IDs: ${missing.join(", ")}. ` +
        "Expected proposal.sections to include (and allow ordering) 5.1–5.10.",
    );
  }

  const budgetBox = proposal?.budget_box;
  const lumpSum = budgetBox?.lump_sum;
  if (typeof lumpSum?.usd !== "number" || Number.isNaN(lumpSum.usd)) {
    throw new Error("budget_box.lump_sum.usd must exist and be a number");
  }
  if (typeof lumpSum?.rmb !== "number" || Number.isNaN(lumpSum.rmb)) {
    throw new Error("budget_box.lump_sum.rmb must exist and be a number");
  }
  if (lumpSum.usd >= 100000) {
    throw new Error("budget_box.lump_sum.usd must be < 100000");
  }

  const budgetUsd = lumpSum.usd;
  const budgetRmb = lumpSum.rmb;
  const budgetNote = budgetBox?.note ?? proposal?.budget?.note;
  const budgetConstraints = budgetBox?.constraints ?? [];
  const lineItems = budgetBox?.line_items ?? [];

  const children = [];

  // Title page
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true, size: 40 })],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Product-driven scientific proposal (radiology)", size: 22, color: "666666" })],
    }),
  );
  children.push(blank());

  // Budget box
  children.push(heading("Budget (lump-sum)", HeadingLevel.HEADING_2));
  children.push(
    simpleTable({
      header: ["Currency", "Amount"],
      rows: [
        ["USD", budgetUsd != null ? `$${money(budgetUsd)}` : ""],
        ["RMB", budgetRmb != null ? `¥${money(budgetRmb)}` : ""],
      ],
    }),
  );
  if (fx != null || fxNote) {
    children.push(p(`FX assumption: 1 USD = ${fx ?? "?"} RMB${fxNote ? ` — ${fxNote}` : ""}`));
  }
  if (budgetNote) children.push(p(`Note: ${budgetNote}`));
  if (budgetConstraints.length) {
    children.push(p("Constraints:", { bold: true }));
    children.push(...budgetConstraints.map((c) => bullet(c)));
  }

  if (lineItems.length) {
    children.push(blank());
    children.push(heading("Budget line items", HeadingLevel.HEADING_3));
    children.push(
      simpleTable({
        header: ["Item", "Role", "USD", "RMB", "Notes"],
        rows: lineItems.map((li) => [
          li.item ?? "",
          li.role ?? "",
          li.usd != null ? `$${money(li.usd)}` : "",
          li.rmb != null ? `¥${money(li.rmb)}` : "",
          li.notes ?? "",
        ]),
      }),
    );
  }

  // Figures (auto-embed if available)
  children.push(blank());
  children.push(heading("Figures", HeadingLevel.HEADING_2));

  children.push(
    ...tryEmbedImage({
      repoRoot,
      candidates: [
        "src/assets/images/generated/proposal_program_architecture_1536x672.png",
        "src/assets/images/generated/proposal_program_architecture.png",
      ],
      width: 640,
      height: 280,
      caption: "Figure 1. Program architecture (informatics + Radimetrics + injector + contrast).",
    }),
  );

  children.push(
    ...tryEmbedImage({
      repoRoot,
      candidates: [
        "src/assets/images/generated/proposal_dose_governance_loop_1536x672.png",
        "src/assets/images/generated/proposal_dose_governance_loop.png",
      ],
      width: 640,
      height: 280,
      caption: "Figure 2. Dose governance closed-loop (alert → review → action).",
    }),
  );

  children.push(
    ...tryEmbedImage({
      repoRoot,
      candidates: [
        "src/assets/images/generated/proposal_consortium_scaling_blueprint_1536x672.png",
        "src/assets/images/generated/proposal_consortium_scaling_blueprint.png",
      ],
      width: 640,
      height: 280,
      caption: "Figure 3. Consortium scaling blueprint (hub-and-spoke).",
    }),
  );

  children.push(
    ...tryEmbedImage({
      repoRoot,
      candidates: [
        "src/assets/images/generated/proposal_implementation_roadmap_1536x672.png",
        "src/assets/images/generated/proposal_implementation_roadmap.png",
      ],
      width: 640,
      height: 280,
      caption: "Figure 4. Implementation roadmap (Phase 1–3).",
    }),
  );

  // Sections 5.1.10
  children.push(blank());
  children.push(heading("Proposal", HeadingLevel.HEADING_1));

  // Enforce required ordering 5.1–5.10 (exported in this exact order)
  const orderedSections = requiredSectionIds.map((id) => byId.get(id));
  for (const s of orderedSections) {
    const h = s.heading ?? s.id ?? "";
    if (h) children.push(heading(h, HeadingLevel.HEADING_2));

    for (const blk of parseTextBlocks(s.text)) {
      if (blk.kind === "bullet") children.push(bullet(blk.text));
      else children.push(p(blk.text));
    }

    if (s.id === "5.8") {
      // Metrics table placeholder
      children.push(blank());
      children.push(heading("Validation metrics (example)", HeadingLevel.HEADING_3));
      children.push(
        simpleTable({
          header: ["Domain", "Metric", "Target / success criteria"],
          rows: [
            ["Diagnostic accuracy", "Lesion detection sensitivity", "+5% vs baseline"],
            ["Workflow efficiency", "Time-to-protocol selection", "-30%"],
            ["Radiation", "Effective dose (mSv)", "-15%"],
            ["Productivity", "Cases read per radiologist per day", "+10%"],
          ],
        }),
      );
    }

    children.push(blank());
  }

  // References list (numbered)
  const citations = Array.isArray(proposal?.citations) ? proposal.citations : [];
  if (citations.length) {
    children.push(heading("References", HeadingLevel.HEADING_2));
    citations.forEach((c, idx) => {
      const src = c.source || {};
      const parts = [];
      if (src.title) parts.push(src.title);
      if (src.year) parts.push(String(src.year));
      if (src.url) parts.push(String(src.url));
      const line = parts.join(". ");
      children.push(p(`[${idx + 1}] ${line || c.id || ""}`));
    });
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);

  // Avoid unused warning if requirements is passed but not used in minimal renderer
  void requirements;
}
