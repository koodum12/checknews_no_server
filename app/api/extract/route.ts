/**
 * POST /api/extract — URL에서 기사 본문 추출 (서버사이드 fetch + GPT 정제)
 * 서버에서 실행되므로 브라우저 CORS 제약 없이 뉴스 페이지를 가져올 수 있습니다.
 */
import { extractFromUrlServer } from "@/lib/openaiServer";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  let payload: { url?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ detail: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const url = (payload.url ?? "").trim();
  if (!url) {
    return Response.json({ detail: "URL이 비어 있습니다." }, { status: 400 });
  }

  if (!apiKey) {
    return Response.json(
      { detail: "서버에 OPENAI_API_KEY 환경변수가 설정되지 않았습니다. 본문을 직접 붙여넣어 주세요." },
      { status: 500 }
    );
  }

  try {
    const result = await extractFromUrlServer(apiKey, url);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "본문 추출에 실패했습니다.";
    return Response.json({ detail: message }, { status: 502 });
  }
}
