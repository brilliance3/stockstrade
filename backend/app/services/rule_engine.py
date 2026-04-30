from __future__ import annotations

from app.models.analysis_schema import ChartAnalysisResult


def apply_first_principle_rules(result: ChartAnalysisResult) -> ChartAnalysisResult:
    if result.currentPrice is not None:
        add_risk = check_chase_buying_risk(result)
        if add_risk:
            result.riskFactors.append(add_risk)

    if result.entryJudgment.stopLoss and result.currentPrice:
        loss = abs(result.currentPrice - result.entryJudgment.stopLoss)
        if result.currentPrice > 0 and (loss / result.currentPrice) > 0.06:
            result.riskFactors.append("손절선이 멀어 손익비가 불리할 수 있습니다.")
            result.entryJudgment.action = "wait"
            result.entryJudgment.grade = "C"

    if result.trend == "downtrend":
        result.entryJudgment.action = "avoid"
        result.entryJudgment.grade = "D"
        result.riskFactors.append("하락 추세 구간으로 신규 진입은 보수적으로 접근해야 합니다.")

    if not result.finalConclusion:
        result.finalConclusion = "조건 충족 여부 중심으로 관찰이 필요합니다."
    if not result.tradingNote:
        result.tradingNote = "- 조건 미충족 시 대기\n- 손절 기준 명확화 후 진입 검토"
    return result


def check_chase_buying_risk(result: ChartAnalysisResult) -> str | None:
    if result.currentPrice is None or not result.resistanceLevels:
        return None
    nearest_resistance = min(
        (level.price for level in result.resistanceLevels if level.price is not None),
        default=None,
    )
    if nearest_resistance is None:
        return None
    gap = (nearest_resistance - result.currentPrice) / result.currentPrice
    if gap <= 0.02:
        return "저항선 근접 구간으로 추격매수 리스크가 큽니다."
    return None
