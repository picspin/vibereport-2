import OpenAI from "openai";

const MODEL = process.env.LITELLM_MODEL || "mga-gpt-5";
const BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000/v1";

function requiredSectionHeadings() {
  return [
    "5.1 Executive Summary",
    "5.2 Clinical & Workflow Problem",
    "5.3 Opportunity for Product Innovation",
    "5.4 Proposed Scientific Collaboration",
    "5.5 Solution Concept",
    "5.6 Product Development Impact",
    "5.7 Demonstration Site Strategy",
    "5.8 Validation Plan",
    "5.9 Commercial Potential",
    "5.10 Implementation Roadmap",
  ];
}

export function buildProposalPrompt(requirements) {
  return `You are a product-driven scientific proposal writer for radiology solutions development.

CONTEXT:
- Deliverable: longform English scientific proposal, 150062500 words.
- Must use headings 5.165.10 exactly as specified below.
- Narrative focus: Abdominal CT Excellence Program; informatics/software focus.
- Must bind: Radimetrics dose governance + dashboard co-creation; Centargo/Stellant + disposables; contrast portfolio including Primovist.
- Allowed terms to include when relevant: Smart Protocol, CVI42.
- Budget: single lump-sum < USD 100k. Present amounts in USD with RMB equivalent (use an explicit FX assumption).
- Team framing: Product/Innovation lead + Medical Affairs co-support.
- Study preference: prospective preferred, retrospective acceptable.
- IRB timeline: 263 weeks.

REQUIREMENTS DATA (source-of-truth):
${JSON.stringify(requirements, null, 2)}

TASK:
Return ONLY valid JSON with this exact schema:
{
  "title": string,
  "language": "en",
  "word_count": number,
  "fx_assumption": {"usd_to_rmb": number, "note": string},
  "budget": {"usd": number, "rmb": number, "note": string},
  "budget_box": {
    "lump_sum": {"usd": number, "rmb": number},
    "fx_assumption": {"usd_to_rmb": number, "note": string},
    "constraints": [string],
    "line_items": [
      {"item": string, "role": string, "usd": number, "rmb": number, "notes": string}
    ],
    "roles": [
      {"role": string, "responsibilities": [string]}
    ],
    "total_check": {"usd": number, "rmb": number}
  },
  "sections": [
    {"id": "5.1", "heading": "5.1 Executive Summary", "text": string},
    {"id": "5.2", "heading": "5.2 Clinical & Workflow Problem", "text": string},
    {"id": "5.3", "heading": "5.3 Opportunity for Product Innovation", "text": string},
    {"id": "5.4", "heading": "5.4 Proposed Scientific Collaboration", "text": string},
    {"id": "5.5", "heading": "5.5 Solution Concept", "text": string},
    {"id": "5.6", "heading": "5.6 Product Development Impact", "text": string},
    {"id": "5.7", "heading": "5.7 Demonstration Site Strategy", "text": string},
    {"id": "5.8", "heading": "5.8 Validation Plan", "text": string},
    {"id": "5.9", "heading": "5.9 Commercial Potential", "text": string},
    {"id": "5.10", "heading": "5.10 Implementation Roadmap", "text": string}
  ],
  "citations": [
    {
      "id": string,
      "claim": string,
      "source": {"type": "guideline"|"paper"|"registry"|"vendor_doc"|"other", "title": string, "year": number, "url": string|null},
      "where_used": ["5.1"|"5.2"|"5.3"|"5.4"|"5.5"|"5.6"|"5.7"|"5.8"|"5.9"|"5.10"]
    }
  ]
}

HARD RULES:
- No markdown.
- Sections.text must be plain text paragraphs, may include short bullet-like lines using leading "- " only when appropriate.
- Section 5.1 text must be 1506200 words.
- Ensure the full proposal length is 150062500 words; set word_count accordingly.
- Do not fabricate specific performance numbers; you may use qualitative claims or ranges only if widely accepted and cited.
- Citations must be plausible and non-hallucinated: if you cannot name a specific source, omit the claim or mark source.type="other" with url=null and a conservative title.
- Ensure the proposal explicitly ties collaboration outputs to product roadmap improvements (Radimetrics, Centargo/Stellant, disposables, contrast portfolio; optional Smart Protocol and CVI42).
`;
}

export function validateProposalJson(proposal) {
  if (!proposal || typeof proposal !== "object") throw new Error("proposal must be an object");
  if (proposal.language !== "en") throw new Error("proposal.language must be 'en'");
  if (!Array.isArray(proposal.sections)) throw new Error("proposal.sections must be an array");

  const required = requiredSectionHeadings();
  const headings = proposal.sections.map((s) => s?.heading);
  for (const h of required) {
    if (!headings.includes(h)) throw new Error(`proposal missing required section heading: ${h}`);
  }

  const exec = proposal.sections.find((s) => s?.id === "5.1");
  const execWords = String(exec?.text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (execWords < 150 || execWords > 200) {
    throw new Error(`5.1 Executive Summary must be 150-200 words; got ${execWords}`);
  }

  const allText = proposal.sections.map((s) => String(s?.text || "")).join("\n\n");
  const totalWords = allText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (totalWords < 1500 || totalWords > 2500) {
    throw new Error(`proposal must be 1500-2500 words; got ${totalWords}`);
  }

  if (!Number.isFinite(proposal.word_count)) {
    throw new Error("proposal.word_count must be a number");
  }

  if (!proposal.budget_box || typeof proposal.budget_box !== "object") {
    throw new Error("proposal.budget_box must exist and be an object");
  }
  if (!proposal.budget_box.lump_sum || typeof proposal.budget_box.lump_sum !== "object") {
    throw new Error("proposal.budget_box.lump_sum must exist and be an object");
  }
  if (!Number.isFinite(proposal.budget_box.lump_sum.usd) || proposal.budget_box.lump_sum.usd >= 100000) {
    throw new Error("proposal.budget_box.lump_sum.usd must be a number < 100000");
  }
  if (!Number.isFinite(proposal.budget_box.lump_sum.rmb)) {
    throw new Error("proposal.budget_box.lump_sum.rmb must be a number");
  }
  if (!proposal.budget_box.fx_assumption || typeof proposal.budget_box.fx_assumption !== "object") {
    throw new Error("proposal.budget_box.fx_assumption must exist and be an object");
  }
  if (!Number.isFinite(proposal.budget_box.fx_assumption.usd_to_rmb)) {
    throw new Error("proposal.budget_box.fx_assumption.usd_to_rmb must be a number");
  }
  if (typeof proposal.budget_box.fx_assumption.note !== "string" || !proposal.budget_box.fx_assumption.note.trim()) {
    throw new Error("proposal.budget_box.fx_assumption.note must be a non-empty string");
  }
  if (!Array.isArray(proposal.budget_box.line_items) || proposal.budget_box.line_items.length === 0) {
    throw new Error("proposal.budget_box.line_items must be a non-empty array");
  }
  if (!Array.isArray(proposal.budget_box.roles) || proposal.budget_box.roles.length === 0) {
    throw new Error("proposal.budget_box.roles must be a non-empty array");
  }

  if (!Array.isArray(proposal.citations)) throw new Error("proposal.citations must be an array");
}

export async function generateProposalContent(requirements) {
  const client = new OpenAI({
    baseURL: BASE_URL,
    apiKey: process.env.LITELLM_API_KEY || "litellm",
  });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: buildProposalPrompt(requirements) }],
    temperature: 0.2,
  });

  const text = (response.choices?.[0]?.message?.content || "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Claude output was not valid JSON: ${msg}\n---\n${text.slice(0, 2000)}`);
  }

  validateProposalJson(parsed);
  return parsed;
}
