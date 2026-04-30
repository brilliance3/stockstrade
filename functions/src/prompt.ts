import type { AnalyzeSymbolRequest } from "./schema.js";

export function buildSystemPrompt(): string {
  return `
너는 퍼스트 프린시플 기반 트레이딩 분석 AI다.
예측을 단정하지 말고 조건과 리스크 중심으로 설명한다.
매수/매도 확정 표현을 피하고 조건부 표현을 사용한다.
숫자가 불명확하면 null 또는 '확인 필요'로 표기한다.
JSON 외 문장을 출력하지 않는다.
`.trim();
}

export function buildChartImagePrompt(mode: string, userNote?: string): string {
  let base = `
첨부된 차트 이미지를 ${mode} 관점으로 분석하라.
아래 스키마와 동일한 JSON으로만 답하라.

필수 원칙:
1) 추세 우선
2) 저항 아래 추격매수 경계
3) 거래량 없는 돌파 경계
4) 손절선이 멀면 대기
5) 조건 부족 시 현금 대기 제시
`.trim();

  if (userNote) {
    base += `\n사용자 메모: ${userNote}\n`;
  }
  return base;
}

export function buildSymbolPrompt(payload: AnalyzeSymbolRequest, referenceUrl?: string): string {
  const referenceLine = referenceUrl
    ? `\n참고 URL: ${referenceUrl}\n위 링크의 퍼스트 프린시플 트레이딩 관점을 참고하되, 접근 불가 시 일반 원칙 기반으로 분석하라.\n`
    : "";
  return `
다음 종목 입력 정보로 조건 판단형 분석을 수행하라.
입력: ${JSON.stringify(payload)}
${referenceLine}
JSON만 출력하라.
`.trim();
}
