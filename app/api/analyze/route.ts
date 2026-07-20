/**
 * POST /api/analyze — 서버리스 편향 분석 (OpenAI 서버사이드 호출)
 * OPENAI_API_KEY 는 Vercel 환경변수에서 읽으며 브라우저에 노출되지 않습니다.
 * 키가 없거나 실패하면 500 → 프론트(lib/api.ts)가 클라이언트 mock으로 폴백합니다.
 */
import { analyzeWithGpt, cleanBodyWithGpt } from "@/lib/openaiServer";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "서버에 OPENAI_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let payload: { body?: string; clean_body?: boolean };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const body = (payload.body ?? "").trim();
  if (!body) {
    return Response.json({ error: "기사 본문이 비어 있습니다." }, { status: 400 });
  }

  try {
    let text = body;
    let cleaned = false;
    if (payload.clean_body) {
      const before = text.length;
      text = await cleanBodyWithGpt(apiKey, text);
      cleaned = text.length !== before;
    }
    const result = await analyzeWithGpt(apiKey, text);
    return Response.json({ ...result, cleaned_body: cleaned });
  } catch (e) {
    const message = e instanceof Error ? e.message : "분석에 실패했습니다.";
    return Response.json({ error: message }, { status: 502 });
  }
}
