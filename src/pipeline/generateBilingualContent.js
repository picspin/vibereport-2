import OpenAI from "openai";

const MODEL = process.env.LITELLM_MODEL || "mga-gpt-5";
const BASE_URL = process.env.LITELLM_BASE_URL || "http://localhost:4000/v1";

export function buildCopyPrompt(requirements) {
  return `You are writing premium, corporate, data-driven investment collateral.

CONTEXT:
- Audience: global executives, time-constrained.
- Output: two deliverables per language:
  (A) Booth infographic copy: ultra concise, minimal text, strong hierarchy.
  (B) Handout promotional copy: minimum 200 words, executive tone.
- Must preserve ALL numbers EXACTLY as given. Do not change formatting (commas, decimals, +, %, ranges).

REQUIREMENTS DATA (source-of-truth):
${JSON.stringify(requirements, null, 2)}

TASK:
Generate aligned copy blocks for BOTH English and Simplified Chinese.

OUTPUT FORMAT:
Return ONLY valid JSON with this exact schema:
{
  "en": {
    "infographic": {
      "headline": string,
      "subhead": string,
      "pillars": [{"title": string, "bullets": string[]}],
      "kpis": [{"label": string, "value": string, "note": string}],
      "integration": {"title": string, "items": string[]},
      "coinnovation": {"title": string, "proof": string[]},
      "roi": {"title": string, "bullets": string[]},
      "cta": string
    },
    "handout": {
      "title": string,
      "subtitle": string,
      "executive_summary": string,
      "key_points": string[],
      "cta": string
    },
    "story": {
      "title": string,
      "subtitle": string,
      "intro_plaintext": string,
      "milestones": string[],
      "cta": string
    }
  },
  "zh": {
    "infographic": {
      "headline": string,
      "subhead": string,
      "pillars": [{"title": string, "bullets": string[]}],
      "kpis": [{"label": string, "value": string, "note": string}],
      "integration": {"title": string, "items": string[]},
      "coinnovation": {"title": string, "proof": string[]},
      "roi": {"title": string, "bullets": string[]},
      "cta": string
    },
    "handout": {
      "title": string,
      "subtitle": string,
      "executive_summary": string,
      "key_points": string[],
      "cta": string
    },
    "story": {
      "title": string,
      "subtitle": string,
      "intro_plaintext": string,
      "milestones": string[],
      "cta": string
    }
  }
}

HARD RULES:
- Keep infographic bullets short (max ~12 words EN, ~18 chars-ish ZH).
- No markdown.
- Do not invent new KPIs beyond what is present; you may rephrase labels.
- The handout executive_summary must be >= 200 words in English; Chinese should be similar length.
- The story.intro_plaintext must be >= 200 words in English; Chinese should be similar length.
- Include the four required infographic pillars: scale/leadership, integration depth, co-innovation proof, ROI/growth.
- Story milestones must explicitly include: Jan 2023 start, deployment, co-innovation dashboard, expansion roadmap.
`;
}

export async function generateBilingualContent(requirements) {
  const client = new OpenAI({
    baseURL: BASE_URL,
    apiKey: process.env.LITELLM_API_KEY || "litellm",
  });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: buildCopyPrompt(requirements) }],
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

  return parsed;
}
