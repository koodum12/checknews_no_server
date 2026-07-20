# checkNews — 서버리스(Vercel) 버전

원본 `checkNews/web`(Next.js) 프론트엔드를 **구조·UI·기능 그대로** 유지하면서,
FastAPI 백엔드 대신 **Next.js Route Handler(서버리스 함수)** 로 OpenAI를 호출합니다.

- 별도의 Python 서버를 구축·운영할 필요 없음
- OpenAI API 키는 **서버(환경변수)에서만** 사용 → 브라우저에 노출되지 않음

## 기능 (원본과 동일)

- **기사 편향 분석** (`/analyze`) — URL 자동 추출 + 본문 직접 입력, 백분율 + 높음/중간/낮음
- **대시보드** (`/articles`) — 목록·필터(키워드/언론사/기간/점수)·상세
- **기사 비교** (`/compare`)
- 근거 하이라이트, 편향 점수 게이지 등 UI 그대로

## 서버리스로 바뀐 부분

| 기능 | 원본(FastAPI) | 이 버전 |
| --- | --- | --- |
| 편향 분석 | `POST /analyze` | `POST /api/analyze` (Next 서버리스 함수, OpenAI 서버사이드) |
| URL 본문 추출 | `POST /extract` | `POST /api/extract` (서버사이드 fetch + GPT, CORS 제약 없음) |
| 기사 저장/목록/삭제 | SQLite DB | **브라우저 localStorage** (별도 DB 불필요) |
| 헬스체크 | `GET /health` | `GET /api/health` |

> 저장/목록/비교 데이터는 브라우저 localStorage에 보관됩니다. (기기 간 공유는 안 됨)
> 서버리스 함수 호출이 실패하면 원본과 동일하게 클라이언트 mock 분석으로 폴백합니다.

## 배포 (Vercel · 서버 구축 불필요)

1. 이 저장소를 Vercel에 Import (프레임워크: **Next.js** 자동 감지).
2. **Project Settings → Environment Variables** 에 키 추가:
   - **Name: `OPENAI_API_KEY`**
   - Value: 본인 OpenAI 키 (`sk-...`)
3. Deploy → `https://<프로젝트>.vercel.app`

> 환경변수 추가/변경 후에는 **Redeploy** 해야 반영됩니다.

## 로컬 실행

```bash
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local   # .env* 는 커밋되지 않음
npm run dev                                  # http://localhost:3000
```

## 참고

- 분석 모델 `gpt-4o` · 본문 정제/추출 `gpt-4o-mini`
- 키 변수 이름은 반드시 **`OPENAI_API_KEY`** (서버 전용, `NEXT_PUBLIC_` 아님)
- 분석/추출 프롬프트는 원본 백엔드(`server/services/`)와 동일
