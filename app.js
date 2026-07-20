/*
 * 프론트엔드 — 서버리스 함수(/api/analyze)에 본문을 보내고 결과를 렌더합니다.
 * OpenAI 호출은 전부 서버(Vercel 함수)에서 이뤄지며, 브라우저는 키를 갖지 않습니다.
 */
(function () {
  const $ = (id) => document.getElementById(id);

  const bodyInput = $("body");
  const cleanChk = $("cleanBody");
  const analyzeBtn = $("analyzeBtn");
  const charCount = $("charCount");
  const errorBox = $("errorBox");
  const resultBox = $("resultBox");

  bodyInput.addEventListener("input", () => {
    charCount.textContent = `${bodyInput.value.length}자`;
  });

  function levelLabel(level) {
    return { high: "높음", medium: "중간", low: "낮음" }[level] || level;
  }
  function scoreColor(score) {
    if (score >= 70) return "#dc2626";
    if (score >= 40) return "#d97706";
    return "#059669";
  }
  function scoreLabel(score) {
    if (score >= 70) return "고편향";
    if (score >= 40) return "중편향";
    return "저편향";
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  function renderHighlightedBody(body, highlights) {
    let html = escapeHtml(body);
    const texts = [...new Set(highlights.map((h) => h.text).filter(Boolean))].sort(
      (a, b) => b.length - a.length
    );
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
    const highlights = Array.isArray(r.highlight_sentences) ? r.highlight_sentences : [];
    const highlightsHtml = highlights.length
      ? `
        <div class="section">
          <p class="label">본문 및 편향 근거</p>
          <div class="article">${renderHighlightedBody(body, highlights)}</div>
          <ul class="reasons">
            ${highlights
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

    const body = bodyInput.value.trim();
    if (!body) return showError("기사 본문을 입력하세요.");

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "분석 중…";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, clean: cleanChk.checked }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || `요청 실패 (${res.status})`);
        return;
      }
      renderResult(data, data.body || body, data.cleaned);
    } catch (err) {
      showError(
        "서버 함수(/api/analyze) 호출에 실패했습니다. Vercel 배포 환경 또는 `vercel dev`에서 실행하세요."
      );
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "편향 분석하기";
    }
  }

  analyzeBtn.addEventListener("click", onAnalyze);
})();
