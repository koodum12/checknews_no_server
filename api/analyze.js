/*
 * Vercel 서버리스 함수 — POST /api/analyze
 * 브라우저에서 본문을 받아 OpenAI로 편향을 분석해 결과를 반환합니다.
 * OpenAI 키는 Vercel 환경변수 OPENAI_API_KEY 에서 읽습니다. (브라우저 노출 없음)
 *
 * 요청 본문:  { "body": "기사 본문", "clean": false }
 * 응답 본문:  { bias_score, bias_level, summary, report, highlight_sentences, cleaned, body }
 */
const { analyzeBias, cleanBody } = require("../lib/analyzer");

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (_) {
      return {};
    }
  }
  // 스트림 폴백 (런타임이 body를 파싱하지 않은 경우)
  return await new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (_) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 지원합니다." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "서버에 OPENAI_API_KEY 환경변수가 설정되지 않았습니다. (Vercel Project Settings → Environment Variables)",
    });
    return;
  }

  try {
    const { body, clean } = await readJsonBody(req);
    if (!body || !String(body).trim()) {
      res.status(400).json({ error: "기사 본문이 비어 있습니다." });
      return;
    }

    let text = String(body).trim();
    let cleaned = false;
    if (clean) {
      const before = text.length;
      text = await cleanBody(apiKey, text);
      cleaned = text.length !== before;
    }

    const result = await analyzeBias(apiKey, text);
    res.status(200).json({ ...result, cleaned, body: text });
  } catch (e) {
    res.status(502).json({ error: e && e.message ? e.message : "분석에 실패했습니다." });
  }
};
