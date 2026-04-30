import type { AnalyzeSymbolRequest } from "./schema.js";

export function buildSystemPrompt(): string {
  return `
너는 한국/미국/일본 주식 분석 AI다.
결론은 데이터와 조건 중심으로 제시하고, 예측 단정 표현을 피한다.
항상 JSON만 반환하고 스키마 외 텍스트를 출력하지 않는다.
`.trim();
}

export function buildChartImagePrompt(mode: string, userNote?: string): string {
  let base = `
작업: 첨부 차트 이미지를 ${mode} 관점으로 분석해 JSON 스키마에 맞춰 반환.
핵심 규칙:
- 추세/20일선 위치 우선 판단
- 지지/저항, 거래량, 최근 고저점 기반으로 진입 타이밍 평가
- 신호 부족 시 wait/avoid와 리스크를 명확히 제시
- 손절가/목표가를 가능한 범위에서 수치화
출력 제약:
- 간결한 한국어 문장
- 문자열 필드는 1~2문장
`.trim();

  if (userNote) {
    base += `\n사용자 메모: ${userNote}\n`;
  }
  return base;
}

export function buildSymbolPrompt(payload: AnalyzeSymbolRequest, referenceUrl?: string): string {
  const referenceLine = referenceUrl
    ? `\n참고 URL: ${referenceUrl} (접근 가능 시 참고, 실패 시 무시)\n`
    : "";
  return `
작업: 아래 종목 입력으로 SYSTEM 8.0 + S-RIM 관점의 요약 분석을 JSON 스키마로 반환.
입력: ${JSON.stringify(payload)}
${referenceLine}
핵심 규칙:
- 가치판단(S-RIM): 저평가/적정/고평가를 간단히 반영
- 타이밍판단(SYSTEM 8.0): 추세/거래량/트리거 기준으로 action 판단
- 숫자 우선: 지지/저항/손절/목표가를 가능한 범위에서 제시
- 데이터 부족 시 unknown/null 허용, 대신 riskFactors에 부족 항목 명시
출력 제약:
- JSON만 출력
- 문자열 필드는 1~2문장
`.trim();
}
