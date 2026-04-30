export type Trend = "uptrend" | "downtrend" | "sideways" | "unknown";
export type TrendStrength = "strong" | "medium" | "weak" | "unknown";

export interface PriceLevel {
  price: number | null;
  label: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface VolumeAnalysis {
  visible: boolean;
  interpretation: string;
  recentVolumeTrend: "increasing" | "decreasing" | "neutral" | "unknown";
  warning?: string;
}

export interface EntryJudgment {
  grade: "A" | "B" | "C" | "D";
  action: "buy_watch" | "wait" | "avoid" | "hold_only";
  reason: string;
  idealEntryZone?: string;
  stopLoss?: number | null;
  targetPrice1?: number | null;
  targetPrice2?: number | null;
  riskRewardRatio?: string;
}

export interface ExitJudgment {
  action: "hold" | "partial_take_profit" | "sell_review" | "stop_loss";
  reason: string;
  invalidationPrice?: number | null;
  profitTakingZone?: string;
}

export interface TradingScenario {
  scenarioName: string;
  condition: string;
  expectedMove: string;
  action: string;
}

export interface ChartAnalysisResult {
  symbol: string;
  market?: string;
  timeframe?: string;
  currentPrice?: number | null;
  trend: Trend;
  trendStrength: TrendStrength;
  supportLevels: PriceLevel[];
  resistanceLevels: PriceLevel[];
  volumeAnalysis: VolumeAnalysis;
  entryJudgment: EntryJudgment;
  exitJudgment: ExitJudgment;
  riskFactors: string[];
  scenarios: TradingScenario[];
  finalConclusion: string;
  tradingNote: string;
}

export interface AnalysisApiResponse {
  success: boolean;
  analysisId: string;
  result: ChartAnalysisResult;
}

export interface SymbolAnalyzePayload {
  symbol: string;
  market?: string;
  currentPrice?: number | null;
  averageBuyPrice?: number | null;
  holdingQuantity?: number | null;
  mode: "swing" | "longterm" | "daytrade" | "etf";
  userQuestion?: string;
}
