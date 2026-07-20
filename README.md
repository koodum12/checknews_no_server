# checkNews — 서버리스(FE 전용) 버전

백엔드 서버 없이 **브라우저에서 OpenAI API를 직접 호출**해 뉴스 기사의 편향을
**백분율(0~100%) + 높음/중간/낮음**으로 평가합니다.

- `index.html` — UI (Tailwind 등 외부 의존성 없음, 단일 정적 페이지)
- `app.js` — OpenAI 호출 · 파싱 · 렌더 로직

## 사용 방법

키를 넣는 방법은 두 가지이며, **`env.js`가 있으면 그 값이 우선** 적용됩니다.

### 방법 A — env 파일에서 자동으로 불러오기 (권장)

1. 템플릿을 복사합니다: `cp env.example.js env.js`
2. `env.js` 를 열어 본인 키를 넣습니다. **변수 이름은 `OPENAI_API_KEY`**:
   ```js
   window.OPENAI_API_KEY = "sk-...";
   ```
3. `index.html` 을 엽니다 → 키가 자동으로 채워져 바로 분석 가능합니다.

> `env.js` 는 `.gitignore` 에 등록되어 있어 **커밋/공개되지 않습니다.**
> 저장소에는 값이 없는 `env.example.js` 만 올라갑니다.

### 방법 B — UI에 직접 입력

1. 브라우저에서 `index.html`을 엽니다.
2. **OpenAI API 키**(`sk-...`)를 입력합니다 — 브라우저 `localStorage`에만 저장됩니다.
3. 기사 **본문을 붙여넣고** `편향 분석하기`를 누릅니다.

> URL 자동 추출(크롤링)은 브라우저 CORS 제약 때문에 서버가 필요합니다.
> 이 서버리스 버전은 **본문 직접 붙여넣기**만 지원합니다.

## 배포 (서버 불필요)

정적 파일 2개뿐이라 어디에나 올릴 수 있습니다.

- **GitHub Pages**: 이 폴더를 저장소에 push → Settings → Pages → 브랜치 지정
- **Netlify / Vercel**: 폴더를 드래그&드롭 (빌드 명령 없음)
- **로컬**: `index.html` 더블클릭, 또는 `python3 -m http.server`

## 보안 주의

- **API 키를 코드에 하드코딩하거나 저장소에 커밋하지 마세요.**
  각 사용자가 자신의 키를 UI에 입력하는 구조입니다.
- 키는 입력한 브라우저에만 저장되고, 요청은 `https://api.openai.com` 으로만 전송됩니다.
- 공용 PC에서는 사용 후 키 입력란을 비우면 `localStorage`에서 제거됩니다.

## 모델

- 편향 분석: `gpt-4o`
- 본문 정제(선택): `gpt-4o-mini`

프롬프트는 원본 백엔드(`server/services/gpt_analyzer.py`)와 동일합니다.
