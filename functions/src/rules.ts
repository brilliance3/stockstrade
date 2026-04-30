import type { ChartAnalysisResult } from "./schema.js";

export function applyFirstPrincipleRules(result: ChartAnalysisResult): ChartAnalysisResult {
  if (result.currentPrice != null) {
    const chaseRisk = checkChaseBuyingRisk(result);
    if (chaseRisk) result.riskFactors.push(chaseRisk);
  }

  if (result.entryJudgment.stopLoss && result.currentPrice) {
    const loss = Math.abs(result.currentPrice - result.entryJudgment.stopLoss);
    if (result.currentPrice > 0 && loss / result.currentPrice > 0.06) {
      result.riskFactors.push("손절선이 멀어 손익비가 불리할 수 있습니다.");
      result.entryJudgment.action = "wait";
      result.entryJudgment.grade = "C";
    }
  }

  if (result.trend === "downtrend") {
    result.entryJudgment.action = "avoid";
    result.entryJudgment.grade = "D";
    result.riskFactors.push("하락 추세 구간으로 신규 진입은 보수적으로 접근해야 합니다.");
  }

  if (!result.finalConclusion) {
    result.finalConclusion = "조건 충족 여부 중심으로 관찰이 필요합니다.";
  }
  if (!result.tradingNote) {
    result.tradingNote = "- 조건 미충족 시 대기\n- 손절 기준 명확화 후 진입 검토";
  }
  return result;
}

function checkChaseBuyingRisk(result: ChartAnalysisResult): string | null {
  if (result.currentPrice == null || result.resistanceLevels.length === 0) return null;
  const nearest = result.resistanceLevels.reduce<number | null>((acc, level) => {
    if (level.price == null) return acc;
    if (acc == null || level.price < acc) return level.price;
    return acc;
  }, null);
  if (nearest == null) return null;
  const gap = (nearest - result.currentPrice) / result.currentPrice;
  return gap <= 0.02 ? "저항선 근접 구간으로 추격매수 리스크가 큽니다." : null;
}
