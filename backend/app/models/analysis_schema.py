from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PriceLevel(BaseModel):
    price: float | None = None
    label: str = ""
    reason: str = ""
    confidence: Literal["high", "medium", "low"] = "medium"


class VolumeAnalysis(BaseModel):
    visible: bool = False
    interpretation: str = ""
    recentVolumeTrend: Literal["increasing", "decreasing", "neutral", "unknown"] = "unknown"
    warning: str | None = None


class EntryJudgment(BaseModel):
    grade: Literal["A", "B", "C", "D"] = "C"
    action: Literal["buy_watch", "wait", "avoid", "hold_only"] = "wait"
    reason: str = ""
    idealEntryZone: str | None = None
    stopLoss: float | None = None
    targetPrice1: float | None = None
    targetPrice2: float | None = None
    riskRewardRatio: str | None = None


class ExitJudgment(BaseModel):
    action: Literal["hold", "partial_take_profit", "sell_review", "stop_loss"] = "hold"
    reason: str = ""
    invalidationPrice: float | None = None
    profitTakingZone: str | None = None


class TradingScenario(BaseModel):
    scenarioName: str
    condition: str
    expectedMove: str
    action: str


class ChartAnalysisResult(BaseModel):
    symbol: str = "UNKNOWN"
    market: str | None = None
    timeframe: str | None = None
    currentPrice: float | None = None
    trend: Literal["uptrend", "downtrend", "sideways", "unknown"] = "unknown"
    trendStrength: Literal["strong", "medium", "weak", "unknown"] = "unknown"
    supportLevels: list[PriceLevel] = Field(default_factory=list)
    resistanceLevels: list[PriceLevel] = Field(default_factory=list)
    volumeAnalysis: VolumeAnalysis = Field(default_factory=VolumeAnalysis)
    entryJudgment: EntryJudgment = Field(default_factory=EntryJudgment)
    exitJudgment: ExitJudgment = Field(default_factory=ExitJudgment)
    riskFactors: list[str] = Field(default_factory=list)
    scenarios: list[TradingScenario] = Field(default_factory=list)
    finalConclusion: str = ""
    tradingNote: str = ""


class AnalyzeSymbolRequest(BaseModel):
    symbol: str
    market: str | None = None
    currentPrice: float | None = None
    averageBuyPrice: float | None = None
    holdingQuantity: float | None = None
    mode: Literal["swing", "longterm", "daytrade", "etf"] = "swing"
    userQuestion: str | None = None


class AnalyzeResponse(BaseModel):
    success: bool = True
    analysisId: str
    result: ChartAnalysisResult
