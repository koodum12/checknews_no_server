/*
 * checkNews (서버리스 버전) — 브라우저에서 OpenAI API를 직접 호출해
 * 기사 편향을 백분율 + 높음/중간/낮음으로 평가합니다.
 *
 * 순수 로직(buildAnalyzeRequest / parseAnalysis / callOpenAI 등)은
 * Node 테스트에서도 재사용할 수 있도록 아래에서 module.exports 합니다.
 */

// ── 프롬프트 (server/services/gpt_analyzer.py 와 동일) ─────────────
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

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANALYZE_MODEL = "gpt-4o";
const CLEAN_MODEL = "gpt-4o-mini";

// ── 순수 로직 ─────────────────────────────────────────────────────
function buildAnalyzeRequest(body) {
  return {
    model: ANALYZE_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: BIAS_ANALYSIS_PROMPT },
      { role: "user", content: `다음 기사를 분석해주세요:\n\n${body.slice(0, 4000)}` },
    ],
  };
}

function buildCleanRequest(rawText) {
  return {
    model: CLEAN_MODEL,
    temperature: 0.0,
    max_tokens: 2000,
    messages: [
      { role: "system", content: BODY_CLEAN_PROMPT },
      { role: "user", content: rawText.slice(0, 6000) },
    ],
  };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// OpenAI 응답(JSON 문자열)을 표준 결과 객체로 파싱/보정
function parseAnalysis(raw) {
  const result = JSON.parse(raw);

  let score = Number(result.bias_score);
  if (!Number.isFinite(score)) score = 50.0;
  score = Math.round(clamp(score, 0, 100) * 10) / 10;

  let level = result.bias_level;
  if (!["low", "medium", "high"].includes(level)) {
    level = score >= 61 ? "high" : score >= 41 ? "medium" : "low";
  }

  const highlights = Array.isArray(result.highlight_sentences)
    ? result.highlight_sentences.map((h, i) => ({
        text: h.text || "",
        reason: h.reason || "",
        position: typeof h.position === "number" ? h.position : i,
      }))
    : [];

  return {
    bias_score: score,
    bias_level: level,
    summary: result.summary || "",
    report: result.report || "",
    highlight_sentences: highlights,
  };
}

// fetch 래퍼 (브라우저 전역 fetch / Node 18+ 전역 fetch 모두 동작)
async function callOpenAI(apiKey, reqBody) {
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
      detail = (await res.json())?.error?.message || "";
    } catch (_) {
      /* ignore */
    }
    throw new Error(`OpenAI ${res.status} ${res.statusText}${detail ? " — " + detail : ""}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// 본문 정제 (선택)
async function cleanBody(apiKey, rawText) {
  if (rawText.trim().length < 50) return rawText;
  const content = await callOpenAI(apiKey, buildCleanRequest(rawText));
  const cleaned = content.trim();
  return cleaned.length > 50 ? cleaned : rawText;
}

// 편향 분석 (본문 → 결과 객체)
async function analyzeBias(apiKey, body) {
  const content = await callOpenAI(apiKey, buildAnalyzeRequest(body));
  return parseAnalysis(content);
}

// Node 테스트에서 재사용
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildAnalyzeRequest,
    buildCleanRequest,
    parseAnalysis,
    callOpenAI,
    cleanBody,
    analyzeBias,
  };
}

// ── DOM 연결 (브라우저에서만 실행) ─────────────────────────────────
if (typeof document !== "undefined") {
  const KEY_STORAGE = "checknews_openai_key";
  const $ = (id) => document.getElementById(id);

  const keyInput = $("apiKey");
  const bodyInput = $("body");
  const cleanChk = $("cleanBody");
  const analyzeBtn = $("analyzeBtn");
  const charCount = $("charCount");
  const errorBox = $("errorBox");
  const resultBox = $("resultBox");

  // 키 우선순위: env.js(window.OPENAI_API_KEY) > localStorage 저장값
  const envKey =
    typeof window !== "undefined" && window.OPENAI_API_KEY
      ? String(window.OPENAI_API_KEY).trim()
      : "";
  const savedKey = localStorage.getItem(KEY_STORAGE);
  if (envKey) {
    keyInput.value = envKey;
  } else if (savedKey) {
    keyInput.value = savedKey;
  }

  keyInput.addEventListener("change", () => {
    const v = keyInput.value.trim();
    if (v) localStorage.setItem(KEY_STORAGE, v);
    else localStorage.removeItem(KEY_STORAGE);
  });

  bodyInput.addEventListener("input", () => {
    charCount.textContent = `${bodyInput.value.length}자`;
  });

  function levelLabel(level) {
    return { high: "높음", medium: "중간", low: "낮음" }[level] || level;
  }

  function scoreColor(score) {
    if (score >= 70) return "#dc2626"; // 고편향
    if (score >= 40) return "#d97706"; // 중편향
    return "#059669"; // 저편향
  }

  function scoreLabel(score) {
    if (score >= 70) return "고편향";
    if (score >= 40) return "중편향";
    return "저편향";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  // 원문에 하이라이트 문장을 <mark>로 감싸 렌더
  function renderHighlightedBody(body, highlights) {
    let html = escapeHtml(body);
    const texts = [...new Set(highlights.map((h) => h.text).filter(Boolean))]
      .sort((a, b) => b.length - a.length); // 긴 문장 먼저 치환
    for (const t of texts) {
      const esc = escapeHtml(t);
      html = html.split(esc).join(`<mark>${esc}</mark>`);
    }
    return html.replace(/\n/g, "<br>");
  }

  function gaugeSvg(score) {
    const color = scoreColor(score);
    const r = 54;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    return `
      <svg width="128" height="128" viewBox="0 0 128 128" style="transform:rotate(-90deg)">
        <circle cx="64" cy="64" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="10"/>
        <circle cx="64" cy="64" r="${r}" fill="none" stroke="${color}" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
          style="transition:stroke-dashoffset .6s ease"/>
        <text x="64" y="64" text-anchor="middle" dominant-baseline="middle"
          style="transform:rotate(90deg);transform-origin:64px 64px;fill:${color};font-weight:700;font-size:26px">
          ${score}%
        </text>
      </svg>`;
  }

  function renderResult(r, body, cleaned) {
    const color = scoreColor(r.bias_score);
    const highlightsHtml = r.highlight_sentences.length
      ? `
        <div class="section">
          <p class="label">본문 및 편향 근거</p>
          <div class="article">${renderHighlightedBody(body, r.highlight_sentences)}</div>
          <ul class="reasons">
            ${r.highlight_sentences
              .map(
                (h) =>
                  `<li><span class="q">"${escapeHtml(h.text)}"</span><span class="r">${escapeHtml(h.reason)}</span></li>`
              )
              .join("")}
          </ul>
        </div>`
      : "";

    resultBox.innerHTML = `
      <div class="card result">
        <div class="result-head">
          <div class="gauge">
            ${gaugeSvg(r.bias_score)}
            <span class="gauge-label" style="color:${color}">${scoreLabel(r.bias_score)}</span>
          </div>
          <div class="result-body">
            <div class="badges">
              <span class="badge" style="background:${color}22;color:${color}">
                편향도 ${levelLabel(r.bias_level)}
              </span>
              <span class="badge gpt">GPT-4o 분석</span>
              ${cleaned ? '<span class="badge clean">본문 정제됨</span>' : ""}
            </div>
            ${r.summary ? `<div class="section"><p class="label">요약</p><p class="text">${escapeHtml(r.summary)}</p></div>` : ""}
            <div class="section"><p class="label">편향 판단 근거</p><p class="text">${escapeHtml(r.report)}</p></div>
          </div>
        </div>
        ${highlightsHtml}
      </div>`;
    resultBox.hidden = false;
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  async function onAnalyze() {
    errorBox.hidden = true;
    resultBox.hidden = true;

    const apiKey = keyInput.value.trim();
    let body = bodyInput.value.trim();
    if (!apiKey) return showError("OpenAI API 키를 입력하세요. (sk-... 로 시작)");
    if (!body) return showError("기사 본문을 입력하세요.");

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "분석 중…";
    try {
      let cleaned = false;
      if (cleanChk.checked) {
        const before = body.length;
        body = await cleanBody(apiKey, body);
        cleaned = body.length !== before;
      }
      const result = await analyzeBias(apiKey, body);
      renderResult(result, body, cleaned);
    } catch (err) {
      showError(err instanceof Error ? err.message : "분석에 실패했습니다.");
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "편향 분석하기";
    }
  }

  analyzeBtn.addEventListener("click", onAnalyze);
}
