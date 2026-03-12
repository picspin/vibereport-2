#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs";

import { parseRequirementsFile } from "../pipeline/parseRequirements.js";
import { generateBilingualContent } from "../pipeline/generateBilingualContent.js";
import {
  defaultNanobananaPrompts,
  generateImagesNanobanana,
} from "../pipeline/generateImagesNanobanana.js";
import { readCss, renderBoothInfographicHtml } from "../templates/renderInfographic.js";
import { exportPdf } from "../pipeline/exportPdf.js";
import { exportDocx } from "../pipeline/exportDocx.js";
import { defaultStoryImages, exportStoryDocx } from "../pipeline/exportStoryDocx.js";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const requirementsPath = path.join(repoRoot, "requirements.md");
  const outDir = path.join(repoRoot, "out");

  ensureDir(outDir);

  const requirements = parseRequirementsFile(requirementsPath);

  const snapshotPath = path.join(outDir, "requirements.parsed.json");
  fs.writeFileSync(snapshotPath, JSON.stringify(requirements, null, 2) + "\n", "utf8");
  console.log(`Wrote ${path.relative(repoRoot, snapshotPath)}`);

  let bilingual = null;
  if (process.env.SKIP_LLM !== "1") {
    bilingual = await generateBilingualContent(requirements);
    const copyPath = path.join(outDir, "copy.bilingual.json");
    fs.writeFileSync(copyPath, JSON.stringify(bilingual, null, 2) + "\n", "utf8");
    console.log(`Wrote ${path.relative(repoRoot, copyPath)}`);
  } else {
    console.log("SKIP_LLM=1 set; skipping Claude copy generation");
  }

  let images = [];
  if (process.env.SKIP_IMAGES !== "1") {
    const prompts = defaultNanobananaPrompts({
      requirements,
      lang: process.env.IMG_LANG === "zh" ? "zh" : "en",
    });

    images = generateImagesNanobanana({
      repoRoot,
      prompts,
      resolution: process.env.IMG_RESOLUTION || "1K",
    });

    const imagesPath = path.join(outDir, "images.generated.json");
    fs.writeFileSync(imagesPath, JSON.stringify(images, null, 2) + "\n", "utf8");
    console.log(`Wrote ${path.relative(repoRoot, imagesPath)}`);
  } else {
    console.log("SKIP_IMAGES=1 set; skipping nanobanana image generation");
  }

  const cssText = readCss(repoRoot);

  const langs = [
    { key: "en", html: "booth_infographic.en.html", pdf: "booth_infographic.en.a4.pdf" },
    { key: "zh", html: "booth_infographic.zh.html", pdf: "booth_infographic.zh.a4.pdf" },
  ];

  for (const l of langs) {
    const copy = bilingual?.[l.key] ?? null;
    const html = renderBoothInfographicHtml({
      lang: l.key,
      copy,
      requirements,
      images,
      cssText,
    });

    const htmlPath = path.join(outDir, l.html);
    fs.writeFileSync(htmlPath, html, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, htmlPath)}`);

    if (process.env.SKIP_PDF !== "1") {
      const pdfPath = path.join(outDir, l.pdf);
      await exportPdf({ htmlPath, pdfPath });
      console.log(`Wrote ${path.relative(repoRoot, pdfPath)}`);
    } else {
      console.log("SKIP_PDF=1 set; skipping PDF export");
    }

    if (process.env.SKIP_DOCX !== "1") {
      const docxPath = path.join(
        outDir,
        l.key === "zh" ? "handout_promotional_copy.zh.docx" : "handout_promotional_copy.en.docx",
      );
      await exportDocx({ outPath: docxPath, lang: l.key, copy: copy?.["handout"], requirements });
      console.log(`Wrote ${path.relative(repoRoot, docxPath)}`);

      const storyPath = path.join(
        outDir,
        l.key === "zh" ? "story_infographic_timeline.zh.docx" : "story_infographic_timeline.en.docx",
      );
      await exportStoryDocx({
        outPath: storyPath,
        lang: l.key,
        storyCopy: copy?.story,
        requirements,
        images: defaultStoryImages(repoRoot),
      });
      console.log(`Wrote ${path.relative(repoRoot, storyPath)}`);
    } else {
      console.log("SKIP_DOCX=1 set; skipping DOCX export");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
