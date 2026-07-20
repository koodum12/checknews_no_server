/**
 * GET /api/health — 서버리스 함수 동작 확인 (ApiStatusIndicator 용)
 * OPENAI_API_KEY 설정 여부도 함께 반환합니다.
 */
export async function GET() {
  return Response.json({
    status: "ok",
    openai_key: Boolean(process.env.OPENAI_API_KEY),
  });
}
