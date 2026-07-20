/**
 * 서버 전용(OpenAI 호출) 로직 — Next.js Route Handler(app/api/*)에서만 import.
 * 브라우저 번들에 포함되지 않으므로 OPENAI_API_KEY 가 노출되지 않습니다.
 * 프롬프트는 원본 백엔드(server/services/gpt_analyzer.py, body_extractor.py)와 동일합니다.
 */
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANALYZE_MODEL = "gpt-4o";
const CLEAN_MODEL = "gpt-4o-mini";
const EXTRACT_MODEL = "gpt-4o-mini";

const BIAS_ANALYSIS_PROMPT = `당신은 한국어 뉴스 기사의 편향성을 분석하는 전문가입니다.

## 편향 판단 기준
1. **감정적 어투** — 중립적이지 않은 감정을 자극하는 표현 (예: "참담한", "망국적인", "충격적인")
2. **프레이밍** — 사실을 특정 관점으로 틀짓는 표현 (예: "친중 행보", "포퓰리즘 정책")
3. **단정적 서술** — 의견·주장을 사실처럼 서술 (예: "이는 명백히 잘못된 정책이다")
4. **정보 선택 편향** — 한쪽 입장의 주장만 인용하고 반대 의견 무시
5. **출처 불명확** — "전문가들은", "일각에서는" 등 모호한 주체로 특정 주장을 일반화
6. **수식어 편향** — "무분별한", "졸속", "파격" 등 가치판단이 담긴 수식어 남용

## 편향 점수 기준
- 0~20: 매우 낮음 (사실 중심, 양측 균형 보도)
- 21~40: 낮음 (약간의 어투 편향, 전반적으로 균형)
- 41~60: 중간 (뚜렷한 관점, 부분적 불균형)
- 61~80: 높음 (명확한 편향, 한쪽 입장 주도)
- 81~100: 매우 높음 (강한 편향, 사실과 의견 혼재)

## 출력 형식 (JSON만 출력, 다른 텍스트 없이)
{
  "bias_score": 0.0~100.0,
  "bias_level": "low" | "medium" | "high",
  "summary": "기사 요약 (2~3문장)",
  "report": "편향 판단 근거 설명 (3~5문장, 구체적 표현 인용)",
  "highlight_sentences": [
    {"text": "편향된 문장 원문 (기사에 실제 존재하는 문장 그대로)", "reason": "편향 판단 이유", "position": 0}
  ]
}`;

const BODY_CLEAN_PROMPT = `당신은 한국어 뉴스 기사 본문을 정제하는 전문가입니다.

다음 텍스트에서 순수 기사 본문만 추출하세요.
제거 대상:
- 광고 문구, 관련 기사 링크
- 기자 이름·이메일·전화번호
- 저작권 표기 (예: "© 연합뉴스", "무단 전재 금지")
- 사진 설명 캡션
- "▶", "☞", "■" 등으로 시작하는 홍보 문구
- URL

본문 텍스트만 출력하고, 다른 설명은 하지 마세요.`;

export interface HighlightSentence {
  text: string;
  reason: string;
  position: number;
}

export interface AnalyzeResult {
  bias_score: number;
  bias_level: string;
  summary: string;
  report: string;
  highlight_sentences: HighlightSentence[];
  is_mock: boolean;
  used_llm: boolean;
  cleaned_body?: boolean;
}

export interface ExtractResult {
  title: string;
  outlet: string;
  date: string;
  body: string;
  method: "crawler" | "gpt" | "failed";
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

interface ChatRequest {
  model: string;
  temperature: number;
  messages: ChatMessage[];
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

async function callOpenAI(apiKey: string, reqBody: ChatRequest): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(reqBody),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      detail = j?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(`OpenAI ${res.status} ${res.statusText}${detail ? " — " + detail : ""}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function analyzeWithGpt(apiKey: string, body: string): Promise<AnalyzeResult> {
  const raw = await callOpenAI(apiKey, {
    model: ANALYZE_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: BIAS_ANALYSIS_PROMPT },
      { role: "user", content: `다음 기사를 분석해주세요:\n\n${body.slice(0, 4000)}` },
    ],
  });

  const parsed = JSON.parse(raw) as {
    bias_score?: number;
    bias_level?: string;
    summary?: string;
    report?: string;
    highlight_sentences?: Array<{ text?: string; reason?: string; position?: number }>;
  };

  let score = Number(parsed.bias_score);
  if (!Number.isFinite(score)) score = 50.0;
  score = Math.round(clamp(score, 0, 100) * 10) / 10;

  let level = parsed.bias_level ?? "";
  if (!["low", "medium", "high"].includes(level)) {
    level = score >= 61 ? "high" : score >= 41 ? "medium" : "low";
  }

  const highlights: HighlightSentence[] = Array.isArray(parsed.highlight_sentences)
    ? parsed.highlight_sentences.map((h, i) => ({
        text: h.text ?? "",
        reason: h.reason ?? "",
        position: typeof h.position === "number" ? h.position : i,
      }))
    : [];

  return {
    bias_score: score,
    bias_level: level,
    summary: parsed.summary ?? "",
    report: parsed.report ?? "",
    highlight_sentences: highlights,
    is_mock: false,
    used_llm: true,
  };
}

export async function cleanBodyWithGpt(apiKey: string, rawText: string): Promise<string> {
  if (rawText.trim().length < 50) return rawText;
  const content = await callOpenAI(apiKey, {
    model: CLEAN_MODEL,
    temperature: 0.0,
    max_tokens: 2000,
    messages: [
      { role: "system", content: BODY_CLEAN_PROMPT },
      { role: "user", content: rawText.slice(0, 6000) },
    ],
  });
  const cleaned = content.trim();
  return cleaned.length > 50 ? cleaned : rawText;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * URL에서 뉴스 본문 추출 — 서버사이드 fetch(브라우저 CORS 제약 없음) 후 GPT로 정제.
 * 원본 body_extractor.py 의 GPT 추출 경로에 해당.
 */
export async function extractFromUrlServer(apiKey: string, url: string): Promise<ExtractResult> {
  const empty: ExtractResult = { title: "", outlet: "", date: "", body: "", method: "failed" };
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    if (!res.ok) return empty;
    html = await res.text();
  } catch {
    return empty;
  }

  const pageText = htmlToText(html);
  if (pageText.length < 50) return empty;

  const prompt = `다음 텍스트는 뉴스 웹페이지의 전체 텍스트입니다. (URL: ${url})

아래 형식의 JSON만 반환하세요. 본문은 기사 내용 그대로, 광고·기자정보·관련기사·저작권 문구는 제외하세요:
{
  "title": "기사 제목",
  "outlet": "언론사 이름",
  "date": "YYYY-MM-DD",
  "body": "순수 기사 본문 (개행 유지)"
}

텍스트:
${pageText.slice(0, 5000)}`;

  try {
    const content = await callOpenAI(apiKey, {
      model: EXTRACT_MODEL,
      temperature: 0.0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const r = JSON.parse(content) as {
      title?: string;
      outlet?: string;
      date?: string;
      body?: string;
    };
    if (!r.body || !r.body.trim()) return empty;
    return {
      title: r.title ?? "",
      outlet: r.outlet ?? "",
      date: (r.date ?? "").slice(0, 10),
      body: r.body,
      method: "gpt",
    };
  } catch {
    return empty;
  }
}
