import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const NANO_PATH =
  "/Users/hilbert/LLM/agents-and-tools/claude-code-settings/plugins/nanobanana-skill/skills/nanobanana-skill/nanobanana.py";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function generateImagesNanobanana({ repoRoot, prompts, resolution = "1K" }) {
  const outDir = path.join(repoRoot, "src/assets/images/generated");
  ensureDir(outDir);

  const results = [];

  for (const p of prompts) {
    const hash = sha256(JSON.stringify(p));
    const outPath = path.join(outDir, `${p.name}.${hash.slice(0, 10)}.${p.size}.png`);

    if (fs.existsSync(outPath)) {
      results.push({ ...p, path: outPath, cached: true });
      continue;
    }

    const args = [
      NANO_PATH,
      "--prompt",
      p.prompt,
      "--size",
      p.size,
      "--model",
      p.model,
      "--resolution",
      resolution,
      "--output",
      outPath,
    ];

    const proc = spawnSync("python3", args, { encoding: "utf8" });
    if (proc.status !== 0) {
      throw new Error(
        `nanobanana failed for ${p.name}: exit ${proc.status}\n${proc.stderr || proc.stdout}`,
      );
    }

    if (!fs.existsSync(outPath)) {
      throw new Error(`nanobanana did not produce expected file: ${outPath}`);
    }

    results.push({ ...p, path: outPath, cached: false });
  }

  return results;
}

export function defaultNanobananaPrompts({ requirements, lang = "en" }) {
  const brand =
    lang === "zh"
      ? "高端企业风格、医疗科技、深蓝+青灰配色、极简、无文字"
      : "premium corporate healthcare-tech, deep blue + slate palette, minimal, no text";

  const titleHint = requirements?.client?.name ?? "Jiangmen Central Hospital";

  return [
    {
      name: "hero",
      size: "1344x768",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${brand}。为“${titleHint} x Bayer 诊断生态系统”制作一个抽象背景横幅，带有柔和的网格、数据流、放射影像与仪表盘的抽象形态。干净留白，可用于A4信息图顶部背景。`
          : `${brand}. Create an abstract hero background banner for “${titleHint} x Bayer diagnostic ecosystem”: subtle grid, data streams, radiology/imaging motifs, and dashboard-like abstract shapes. Clean whitespace for A4 infographic header.`,
    },
    {
      name: "integration",
      size: "1248x832",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${brand}。制作一个简化的“系统集成/流程”插画：设备→数据→仪表盘→决策闭环。抽象图标风格，轻量线条，无文字。`
          : `${brand}. Create a simplified workflow/integration illustration: devices → data → dashboard → decision loop. Abstract icon style, light linework, no text.`,
    },
    {
      name: "dashboard",
      size: "1024x1024",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${brand}。制作一个抽象“数据仪表盘”面板图：卡片、图表、指标块的组合，具有层次与玻璃拟态轻质感，无文字。`
          : `${brand}. Create an abstract data dashboard panel: cards, charts, KPI blocks, layered composition with subtle glassmorphism feel, no text.`,
    },
  ];
}
