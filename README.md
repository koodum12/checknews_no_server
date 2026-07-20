# checkNews — 서버리스(Vercel) 버전

뉴스 기사의 편향을 **백분율(0~100%) + 높음/중간/낮음**으로 평가합니다.
OpenAI 호출은 **Vercel 서버리스 함수**에서 이뤄지므로,

- 직접 Python/Node 서버를 구축·운영할 필요가 없고
- **OpenAI API 키가 브라우저에 노출되지 않습니다.** (서버 환경변수로만 사용)

## 구조

```
index.html      프론트엔드 UI (정적)
app.js          /api/analyze 호출 + 결과 렌더 (브라우저)
api/analyze.js  Vercel 서버리스 함수 — OpenAI 호출 (동적)
lib/analyzer.js 편향 분석 프롬프트·파싱 로직 (서버 전용)
```

요청/응답:

```
POST /api/analyze   { "body": "기사 본문", "clean": false }
→ { bias_score, bias_level, summary, report, highlight_sentences, cleaned, body }
```

## 배포 (Vercel · 서버 구축 불필요)

1. 이 저장소를 Vercel에 Import (New Project → 이 repo 선택).
   빌드 설정은 기본값 그대로 두면 됩니다. (정적 파일 + `api/` 함수 자동 인식)
2. **Project Settings → Environment Variables** 에 키를 추가합니다.
   - **Name: `OPENAI_API_KEY`**
   - Value: 본인 OpenAI 키 (`sk-...`)
3. Deploy → `https://<프로젝트>.vercel.app` 에서 동작합니다.

> 환경변수를 추가/변경한 뒤에는 **재배포(Redeploy)** 해야 반영됩니다.

## 로컬 실행

```bash
npm i -g vercel
echo "OPENAI_API_KEY=sk-..." > .env   # .env 는 커밋되지 않음
vercel dev                            # http://localhost:3000
```

> `index.html` 을 그냥 더블클릭(file://)하면 `/api/analyze` 함수가 없어 동작하지 않습니다.
> 반드시 Vercel 배포 환경 또는 `vercel dev` 로 실행하세요.

## 참고

- 분석 모델: `gpt-4o` · 본문 정제(선택): `gpt-4o-mini`
- URL 자동 크롤링은 CORS 제약으로 제외 — **본문 붙여넣기** 방식입니다.
- 키 변수 이름은 반드시 **`OPENAI_API_KEY`** 입니다.
