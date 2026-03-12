import fs from "node:fs";
import path from "node:path";

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderList(items) {
  if (!items?.length) return "";
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

export function renderBoothInfographicHtml({ lang, copy, requirements, images, cssText }) {
  const imgByName = new Map((images || []).map((i) => [i.name, i]));
  const hero = imgByName.get("hero");
  const side = imgByName.get("dashboard");

  const c = copy?.infographic;
  const fallbackHeadline =
    lang === "zh"
      ? "江门市中心医院：拜耳诊断生态旗舰标杆"
      : "Jiangmen Central Hospital: Flagship Proof of Bayer Diagnostics";

  const headline = c?.headline ?? fallbackHeadline;
  const subhead =
    c?.subhead ??
    (lang === "zh"
      ? "用关键规模数据、深度集成与共创成果，验证“首选方案”。"
      : "A data-driven flagship case proving the undisputed choice.");

  const pillars =
    c?.pillars ??
    requirements.presentation.infographicMustCommunicate.map((t) => ({
      title: t,
      bullets: [],
    }));

  const numbers = requirements.extractedNumbers;

  const kpis =
    c?.kpis ??
    [
      {
        label: lang === "zh" ? "授权床位" : "Authorized beds",
        value: numbers.bedsAuthorized,
        note: lang === "zh" ? `运营 ${numbers.bedsOperational}` : `${numbers.bedsOperational} operational`,
      },
      {
        label: lang === "zh" ? "门诊量 (2024)" : "Outpatient (2024)",
        value: numbers.outpatientVisits2024,
        note: lang === "zh" ? "年度就诊规模" : "Annual scale",
      },
      {
        label: lang === "zh" ? "出院人数 (2024)" : "Discharges (2024)",
        value: numbers.discharges2024,
        note: lang === "zh" ? "区域枢纽能力" : "Regional hub throughput",
      },
      {
        label: lang === "zh" ? "手术量 (2024)" : "Surgeries (2024)",
        value: numbers.surgeries2024,
        note: lang === "zh" ? `${numbers.tier34SurgeryPct} 三级/四级` : `${numbers.tier34SurgeryPct} Tier 3–4`,
      },
    ];

  const integration =
    c?.integration ??
    ({
      title: lang === "zh" ? "生态系统部署深度" : "Ecosystem integration depth",
      items: requirements.client.ecosystemDeployment,
    });

  const coinnovation =
    c?.coinnovation ??
    ({
      title: lang === "zh" ? "共创验证" : "Co-innovation proof",
      proof: requirements.client.strategicPartnership,
    });

  const roi =
    c?.roi ??
    ({
      title: lang === "zh" ? "增长与ROI潜力" : "Growth & ROI potential",
      bullets:
        lang === "zh"
          ? ["放大规模化复制", "连接更多设备/数据源", "以仪表盘驱动临床与运营决策"]
          : ["Scale blueprint replication", "Extend modality coverage", "Operationalize insights via dashboards"],
    });

  const cta =
    c?.cta ??
    (lang === "zh"
      ? "投资下一阶段：复制该标杆，在更多旗舰医院规模化落地。"
      : "Invest in the next phase: replicate this blueprint across flagship hospitals.");

  const heroStyle = hero ? ` style="background-image:url('${escapeHtml(hero.path)}')"` : "";
  const heroClass = hero ? "hero has-image" : "hero";

  const pageLang = lang === "zh" ? "zh-CN" : "en";

  return `<!doctype html>
<html lang="${pageLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(headline)}</title>
  <style>${cssText}</style>
</head>
<body>
  <div class="page">
    <section class="${heroClass}"${heroStyle}>
      <div class="toprow">
        <div class="badge">${escapeHtml(lang === "zh" ? "5分钟投资提案" : "5-minute investment pitch")}</div>
        <div class="brandmark"><span class="branddot"></span><span>${escapeHtml(lang === "zh" ? "Bayer Diagnostic Solutions" : "Bayer Diagnostic Solutions")}</span></div>
      </div>
      <div class="h1">${escapeHtml(headline)}</div>
      <p class="subhead">${escapeHtml(subhead)}</p>
    </section>

    <section class="grid">
      <div class="col">
        <div class="card">
          <div class="card-title">
            <h2>${escapeHtml(lang === "zh" ? "关键规模指标" : "Scale KPIs")}</h2>
            <div class="small">${escapeHtml(lang === "zh" ? "数据驱动 · 最小文字" : "Data-first · minimal text")}</div>
          </div>
          <div class="kpis">
            ${kpis
              .map(
                (k) => `
              <div class="kpi">
                <div class="value">${escapeHtml(k.value)}</div>
                <div class="label">${escapeHtml(k.label)}</div>
                <div class="note">${escapeHtml(k.note || "")}</div>
              </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <h2>${escapeHtml(lang === "zh" ? "四大信息图主张" : "Four pillars")}</h2>
            <div class="small">${escapeHtml(lang === "zh" ? "领导力 · 集成 · 共创 · ROI" : "Leadership · Integration · Co-innovation · ROI")}</div>
          </div>
          <div class="pillars">
            ${pillars
              .map(
                (p) => `
              <div class="pillar">
                <div class="ptitle"><span class="dot"></span><span>${escapeHtml(p.title)}</span></div>
                ${renderList(p.bullets)}
              </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="cta">
          <strong>${escapeHtml(lang === "zh" ? "下一步" : "Next step")}</strong>
          <p>${escapeHtml(cta)}</p>
        </div>
      </div>

      <div class="col">
        <div class="card">
          <div class="card-title">
            <h2>${escapeHtml(integration.title)}</h2>
            <div class="small">${escapeHtml(lang === "zh" ? "设备 · 覆盖 · 运营" : "Equipment · Coverage · Operations")}</div>
          </div>
          ${renderList(integration.items)}
        </div>

        <div class="card">
          <div class="card-title">
            <h2>${escapeHtml(coinnovation.title)}</h2>
            <div class="small">${escapeHtml(lang === "zh" ? "39个月伙伴关系" : "39-month partnership")}</div>
          </div>
          ${renderList(coinnovation.proof)}
        </div>

        <div class="card">
          <div class="card-title">
            <h2>${escapeHtml(roi.title)}</h2>
            <div class="small">${escapeHtml(lang === "zh" ? "可复制的增长引擎" : "Repeatable growth engine")}</div>
          </div>
          ${renderList(roi.bullets)}
        </div>

        ${side ? `<img class="panelimg" alt="panel" src="${escapeHtml(side.path)}" />` : ""}
      </div>
    </section>

    <div class="footer">
      <div>${escapeHtml(requirements.client.name)}</div>
      <div>${escapeHtml(lang === "zh" ? "单页信息图（A4）" : "Single-page infographic (A4)")}</div>
    </div>
  </div>
</body>
</html>`;
}

export function readCss(repoRoot) {
  return fs.readFileSync(path.join(repoRoot, "src/templates/styles.css"), "utf8");
}
