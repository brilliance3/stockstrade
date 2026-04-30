# First Principle Trader

차트 이미지 인식 기반 AI 분석과 퍼스트 프린시플 룰을 결합한 트레이딩 보조 앱 MVP+입니다.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: FastAPI
- AI: OpenAI Vision (`responses` API)

## Run

### 1) Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

`backend/.env` 주요 설정:
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
ALLOWED_ORIGINS=http://localhost:5173,https://brilliance3.github.io
ENABLE_CHATGPT_WEB_SEARCH=false
CHATGPT_REFERENCE_URL=https://chatgpt.com/g/g-69aa700a96688191984fbf6ae989c093-peoseuteu-peurinsipeol-teureideo
```

또는 `.env` 없이 시스템 환경변수로 직접 주입할 수 있습니다:
```bash
export OPENAI_API_KEY=your_openai_api_key
export OPENAI_MODEL=gpt-5-mini
uvicorn app.main:app --reload --port 8000
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
VITE_API_BASE_URL=http://localhost:8000
```

## API
- `POST /api/analyze/chart-image`
- `POST /api/analyze/symbol`
- `GET /api/analyze/history`

## Notes
- 본 서비스는 투자 자문이 아닌 교육/분석 보조 목적입니다.
- 이미지가 불명확하면 숫자 필드는 `null`로 내려올 수 있습니다.
- GitHub Pages 배포 시 저장소 Variables에 `VITE_API_BASE_URL`(배포된 백엔드 주소)을 반드시 설정해야 합니다.
- `chatgpt.com/g/...` 링크는 공식 API 호출 대상이 아니므로 직접 호출은 불가합니다. 대신 `ENABLE_CHATGPT_WEB_SEARCH=true`로 설정하면 심볼 분석 시 웹검색 툴을 사용해 해당 URL 관점을 참조하도록 동작합니다(모델/계정 권한에 따라 자동 fallback).
