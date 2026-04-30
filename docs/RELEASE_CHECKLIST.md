# Release Checklist

## Pre-deploy
- `functions/.firebaserc` 프로젝트 ID가 실제 Firebase 프로젝트와 일치하는지 확인
- GitHub Secrets: `FIREBASE_TOKEN`, `OPENAI_API_KEY` 설정 확인
- GitHub Variables: `FIREBASE_PROJECT_ID`, `OPENAI_MODEL`, `ENABLE_CHATGPT_WEB_SEARCH`, `CHATGPT_REFERENCE_URL` 확인

## Build/Test
- `cd functions && npm install && npm run build`
- `cd frontend && npm ci && npm run build`
- 로컬 smoke test
  - `GET /health`
  - `POST /api/analyze/symbol` (정상 응답)
  - `POST /api/analyze/chart-image` (이미지 업로드 + 정상 응답)
  - `GET /api/analyze/history` (최근 30개 역순 응답)

## Runtime checks after deploy
- 첫 화면 진입 후 검색 입력/버튼 UI 정상 표시
- 종목 분석 요청 1회 성공
- 이미지 분석 요청 1회 성공
- 오류 상황(잘못된 확장자, 10MB 초과) 메시지 정상 노출
- `OPENAI_API_KEY` 누락 시 에러 메시지 노출 확인

## Performance checks
- 최초 페이지 로드 시간(LCP) 측정
- 첫 분석 요청/재요청 응답 시간(TTFB) 기록
- 콜드스타트 시 최초 API 응답 시간 기록

## Rollback strategy
- 배포 실패 시 직전 안정 커밋으로 `main` 롤백 후 재배포
- Functions 장애 시 임시로 `ENABLE_CHATGPT_WEB_SEARCH=false` 설정 후 재배포
- API 장애 장기화 시 프론트에서 공통 오류 문구 노출 유지

## Incident notes template
- 발생 시각:
- 영향 범위:
- 사용자 영향:
- 즉시 조치:
- 근본 원인:
- 재발 방지 액션:
