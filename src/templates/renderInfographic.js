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

function splitParagraphs(text) {
  return String(text || "")
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function renderParagraphs(text) {
  const parts = splitParagraphs(text);
  if (!parts.length) return "";
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
}

function renderBulletsFromText(text) {
  const lines = String(text || "")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
  if (!bullets.length) return "";
  return `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
}

export function renderProposalHtml({ proposal, requirements, cssText, images = [] }) {
  const title = proposal?.title || "Scientific Collaboration Proposal";
  const pageLang = proposal?.language === "en" ? "en" : "en";

  const imgByName = new Map((images || []).map((i) => [i.name, i]));

  const sections = Array.isArray(proposal?.sections) ? proposal.sections : [];
  const citations = Array.isArray(proposal?.citations) ? proposal.citations : [];
  const budgetBox = proposal?.budget_box || null;

  const figureForSectionId = (id) => {
    const key = String(id || "");
    if (key === "5.1") return imgByName.get("proposal_graphical_abstract");
    if (key === "5.2") return imgByName.get("proposal_problem_map");
    if (key === "5.3") return imgByName.get("proposal_product_innovation_map");
    if (key === "5.4") return imgByName.get("proposal_study_design_flow");
    if (key === "5.5") return imgByName.get("proposal_program_architecture");
    if (key === "5.8") return imgByName.get("proposal_dose_governance_loop");
    if (key === "5.9") return imgByName.get("proposal_consortium_scaling_blueprint");
    if (key === "5.10") return imgByName.get("proposal_implementation_roadmap");
    return null;
  };

  const sectionHtml = sections
    .map((s) => {
      const id = s?.id || "";
      const heading = s?.heading || "";
      const text = s?.text || "";

      const bulletHtml = renderBulletsFromText(text);
      const paraHtml = renderParagraphs(
        String(text || "")
          .split(/\n/)
          .filter((l) => !l.trim().startsWith("- "))
          .join("\n"),
      );

      const fig = figureForSectionId(id);
      const figureHtml = fig
        ? `<figure class="figure"><img alt="diagram" src="${escapeHtml(fig.path)}" /><figcaption class="muted">Diagram (auto-generated)</figcaption></figure>`
        : `
          <div class="figure-placeholder">
            <div class="figure-title">Figure placeholder</div>
            <div class="figure-note">Add diagram/infographic relevant to ${escapeHtml(heading)}.</div>
          </div>`;

      return `
        <section class="section" id="sec-${escapeHtml(id)}">
          <h2>${escapeHtml(heading)}</h2>
          ${paraHtml}
          ${bulletHtml}
          ${figureHtml}
        </section>`;
    })
    .join("\n");

  const referencesHtml = citations.length
    ? `<ol>${citations
        .map((c) => {
          const src = c?.source || {};
          const year = src?.year ? ` (${escapeHtml(src.year)})` : "";
          const titleText = src?.title ? escapeHtml(src.title) : escapeHtml(c?.id || "Source");
          const url = src?.url ? String(src.url) : null;
          const where = Array.isArray(c?.where_used) ? c.where_used.join(", ") : "";
          const claim = c?.claim ? escapeHtml(c.claim) : "";
          return `<li>
              <div class="ref-title">${titleText}${year}</div>
              ${url ? `<div class="ref-url">${escapeHtml(url)}</div>` : ""}
              ${claim ? `<div class="ref-claim">${claim}</div>` : ""}
              ${where ? `<div class="ref-where">Used in: ${escapeHtml(where)}</div>` : ""}
            </li>`;
        })
        .join("\n")}</ol>`
    : `<div class="muted">No references provided.</div>`;

  const budgetHtml = budgetBox
    ? `
      <div class="budget-box">
        <h3>Budget (lump-sum)</h3>
        <div class="budget-top">
          <div class="budget-amount">USD ${escapeHtml(budgetBox?.lump_sum?.usd)}</div>
          <div class="budget-amount muted">RMB ${escapeHtml(budgetBox?.lump_sum?.rmb)}</div>
        </div>
        <div class="budget-fx muted">FX: 1 USD = ${escapeHtml(budgetBox?.fx_assumption?.usd_to_rmb)} RMB (${escapeHtml(
          budgetBox?.fx_assumption?.note || "",
        )})</div>
        ${budgetBox?.constraints?.length ? `<ul>${budgetBox.constraints.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}
        ${budgetBox?.line_items?.length ? `
          <table class="budget-table">
            <thead><tr><th>Item</th><th>Role</th><th>USD</th><th>RMB</th><th>Notes</th></tr></thead>
            <tbody>
              ${budgetBox.line_items
                .map(
                  (li) => `<tr>
                    <td>${escapeHtml(li?.item)}</td>
                    <td>${escapeHtml(li?.role)}</td>
                    <td>${escapeHtml(li?.usd)}</td>
                    <td>${escapeHtml(li?.rmb)}</td>
                    <td>${escapeHtml(li?.notes)}</td>
                  </tr>`,
                )
                .join("\n")}
            </tbody>
          </table>`
        : ""}
      </div>`
    : `<div class="budget-box"><h3>Budget</h3><div class="muted">Budget box missing in proposal JSON.</div></div>`;

  return `<!doctype html>
<html lang="${pageLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${cssText}</style>
</head>
<body>
  <main class="proposal">
    <header class="proposal-header">
      <div class="proposal-title">${escapeHtml(title)}</div>
      <div class="proposal-meta">
        <div>${escapeHtml(requirements?.client?.name || "")}</div>
        <div class="muted">Word count: ${escapeHtml(proposal?.word_count || "")}</div>
      </div>
    </header>

    ${budgetHtml}

    ${sectionHtml}

    <section class="section references" id="references">
      <h2>References</h2>
      ${referencesHtml}
    </section>

    <footer class="proposal-footer muted">
      Generated: ${escapeHtml(new Date().toISOString().slice(0, 10))}
    </footer>
  </main>
</body>
</html>`;
}
