# First Principle Trader

차트 이미지 인식 기반 AI 분석과 퍼스트 프린시플 룰을 결합한 트레이딩 보조 앱 MVP+입니다.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Firebase Functions (Node.js/TypeScript)
- AI: OpenAI Vision (`responses` API)

## Run

### 1) Functions API
```bash
cd functions
npm install
npm run build
```

환경 변수(로컬 또는 CI secret):
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
ENABLE_CHATGPT_WEB_SEARCH=false
CHATGPT_REFERENCE_URL=https://chatgpt.com/g/g-69aa700a96688191984fbf6ae989c093-peoseuteu-peurinsipeol-teureideo
```

### 2) Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`frontend/.env` 예시:
```bash
VITE_API_BASE_URL=/api
```

### 3) Firebase 배포
```bash
# 프로젝트 ID 지정
# .firebaserc 의 default 값을 실제 프로젝트 ID로 교체

# 루트에서 실행
firebase deploy --only functions,hosting
```

## API
- `POST /api/analyze/chart-image`
- `POST /api/analyze/symbol`
- `GET /api/analyze/history`

## Notes
- 본 서비스는 투자 자문이 아닌 교육/분석 보조 목적입니다.
- 이미지가 불명확하면 숫자 필드는 `null`로 내려올 수 있습니다.
- Firebase Hosting rewrite로 `/api/*` 요청이 Functions로 라우팅됩니다.
- `chatgpt.com/g/...` 링크는 공식 API 호출 대상이 아니므로 직접 호출은 불가합니다. 대신 `ENABLE_CHATGPT_WEB_SEARCH=true`로 설정하면 심볼 분석 시 웹검색 툴을 사용해 해당 URL 관점을 참조하도록 동작합니다(모델/계정 권한에 따라 자동 fallback).
- 배포/운영 체크리스트는 `docs/RELEASE_CHECKLIST.md`를 참고하세요.
