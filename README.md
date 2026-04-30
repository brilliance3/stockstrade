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

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

## API
- `POST /api/analyze/chart-image`
- `POST /api/analyze/symbol`
- `GET /api/analyze/history`

## Notes
- 본 서비스는 투자 자문이 아닌 교육/분석 보조 목적입니다.
- 이미지가 불명확하면 숫자 필드는 `null`로 내려올 수 있습니다.
