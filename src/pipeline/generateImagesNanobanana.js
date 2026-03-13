import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const DEFAULT_NANO_PATH = path.resolve(
  process.cwd(),
  "skills/nanobanana-skill/nanobanana.py",
);

function resolveNanoPath() {
  return process.env.NANOBANANA_SCRIPT || DEFAULT_NANO_PATH;
}

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
    const hashedOutPath = path.join(outDir, `${p.name}.${hash.slice(0, 10)}.${p.size}.png`);
    const deterministicOutPath = path.join(outDir, `${p.name}_${p.size}.png`);

    // Back-compat: if deterministic already exists, treat as cached and record it.
    if (fs.existsSync(deterministicOutPath)) {
      results.push({ ...p, path: deterministicOutPath, cached: true });
      continue;
    }

    // Cache: if hashed exists, create deterministic copy and record.
    if (fs.existsSync(hashedOutPath)) {
      fs.copyFileSync(hashedOutPath, deterministicOutPath);
      results.push({ ...p, path: deterministicOutPath, cached: true });
      continue;
    }

    const args = [
      resolveNanoPath(),
      "--prompt",
      p.prompt,
      "--size",
      p.size,
      "--model",
      p.model,
      "--resolution",
      resolution,
      "--output",
      hashedOutPath,
    ];

    const proc = spawnSync("python3", args, { encoding: "utf8" });
    if (proc.status !== 0) {
      throw new Error(
        `nanobanana failed for ${p.name}: exit ${proc.status}\n${proc.stderr || proc.stdout}`,
      );
    }

    if (!fs.existsSync(hashedOutPath)) {
      throw new Error(`nanobanana did not produce expected file: ${hashedOutPath}`);
    }

    fs.copyFileSync(hashedOutPath, deterministicOutPath);
    results.push({ ...p, path: deterministicOutPath, cached: false });
  }

  return results;
}

export function defaultNanobananaPrompts({ requirements, lang = "en" }) {
  const brand =
    lang === "zh"
      ? "高端企业风格、医疗科技、深蓝+青灰配色、极简、无文字"
      : "premium corporate healthcare-tech, deep blue + slate palette, minimal, no text";

  const titleHint = requirements?.client?.name ?? "Jiangmen Central Hospital";

  const diagramBrand =
    lang === "zh"
      ? "极简信息图风格、深蓝+青灰、细线条、扁平+轻微玻璃拟态、无文字、无字母"
      : "minimal infographic style, deep blue + slate palette, fine linework, flat + subtle glassmorphism, no text, no letters";

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

    // Proposal diagrams pack
    {
      name: "proposal_program_architecture",
      size: "1536x672",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${diagramBrand}。绘制“项目架构/系统架构”信息图：四个模块并列并通过数据流连接：放射信息系统/工作流(含PACS/RIS)、Radimetrics剂量管理、注射器/对比剂注射设备、对比剂与耗材供应。以中心“数据平台/集成层”做汇聚，再到“洞察仪表盘/临床决策”。使用抽象图标与连线箭头，保持留白，禁止任何文字与字母。`
          : `${diagramBrand}. Draw a program/system architecture infographic with four modules connected by data flows: radiology informatics/workflow (PACS/RIS), Radimetrics dose management, injector devices, and contrast/consumables. Use a central integration/data layer that aggregates inputs and outputs to an insights dashboard and clinical decisions. Abstract icons + arrows, plenty of whitespace, strictly no text/letters.`,
    },
    {
      name: "proposal_dose_governance_loop",
      size: "1536x672",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${diagramBrand}。绘制“剂量治理闭环”流程图：告警(Alert) → 审核(Review) → 行动(Action) → 复测/监控(Monitor) 循环。每一步用简洁图标表示（警示、医生评审、调整协议、趋势监控），用圆环/循环箭头连接。可加小的侧支：根因分析、协议优化、培训。无文字无字母。`
          : `${diagramBrand}. Draw a dose governance closed-loop diagram: Alert → Review → Action → Monitor (repeat). Each step as a clean icon (warning, clinical review, protocol adjustment, trend monitoring) connected as a circular loop. Optional small side branches for root-cause analysis, protocol optimization, training. No text/letters.`,
    },
    {
      name: "proposal_consortium_scaling_blueprint",
      size: "1536x672",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${diagramBrand}。绘制“联盟规模化蓝图（hub-spoke）”：中心为旗舰/牵头医院（Hub），周围多家分中心/区域医院（Spokes）以网络连接到Hub。表现数据标准、共享仪表盘、统一治理与培训扩散。用节点与连线、层次感，禁止任何文字。`
          : `${diagramBrand}. Draw a consortium scaling blueprint (hub-and-spoke): one central flagship hub hospital connected to multiple spoke hospitals/centers. Indicate standardized data, shared dashboards, governance and training diffusion using icons and network links. No text/letters.`,
    },
    {
      name: "proposal_implementation_roadmap",
      size: "1536x672",
      model: "gemini-3-pro-image-preview",
      prompt:
        lang === "zh"
          ? `${diagramBrand}。绘制“实施路线图 Phase 1–3”时间轴：三段渐进式模块（概念研究→临床试点→产品集成），每段有里程碑图标（数据准备/原型、工作流集成/评估、产品化/规模复制）。用横向时间轴、分段卡片、进度指示，无文字无字母。`
          : `${diagramBrand}. Draw an implementation roadmap timeline with three phases (concept study → clinical pilot → product integration). Each phase has milestone icons (data+prototype, workflow integration+evaluation, productization+scaling). Horizontal segmented timeline with cards/progress markers. No text/letters.`,
    },
  ];
}
