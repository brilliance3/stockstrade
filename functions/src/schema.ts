import { z } from "zod";

export const modeSchema = z.enum(["swing", "longterm", "daytrade"]);

const priceLevelSchema = z.object({
  price: z.number().nullable().optional().default(null),
  label: z.string().default(""),
  reason: z.string().default(""),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

const volumeAnalysisSchema = z.object({
  visible: z.boolean().default(false),
  interpretation: z.string().default(""),
  recentVolumeTrend: z.enum(["increasing", "decreasing", "neutral", "unknown"]).default("unknown"),
  warning: z.string().nullable().optional(),
});

const entryJudgmentSchema = z.object({
  grade: z.enum(["A", "B", "C", "D"]).default("C"),
  action: z.enum(["buy_watch", "wait", "avoid", "hold_only"]).default("wait"),
  reason: z.string().default(""),
  idealEntryZone: z.string().nullable().optional(),
  stopLoss: z.number().nullable().optional(),
  targetPrice1: z.number().nullable().optional(),
  targetPrice2: z.number().nullable().optional(),
  riskRewardRatio: z.string().nullable().optional(),
});

const exitJudgmentSchema = z.object({
  action: z.enum(["hold", "partial_take_profit", "sell_review", "stop_loss"]).default("hold"),
  reason: z.string().default(""),
  invalidationPrice: z.number().nullable().optional(),
  profitTakingZone: z.string().nullable().optional(),
});

const scenarioSchema = z.object({
  scenarioName: z.string(),
  condition: z.string(),
  expectedMove: z.string(),
  action: z.string(),
});

export const chartAnalysisResultSchema = z.object({
  symbol: z.string().default("UNKNOWN"),
  market: z.string().nullable().optional(),
  timeframe: z.string().nullable().optional(),
  currentPrice: z.number().nullable().optional(),
  trend: z.enum(["uptrend", "downtrend", "sideways", "unknown"]).default("unknown"),
  trendStrength: z.enum(["strong", "medium", "weak", "unknown"]).default("unknown"),
  supportLevels: z.array(priceLevelSchema).default([]),
  resistanceLevels: z.array(priceLevelSchema).default([]),
  volumeAnalysis: volumeAnalysisSchema.default({ visible: false, interpretation: "", recentVolumeTrend: "unknown" }),
  entryJudgment: entryJudgmentSchema.default({ grade: "C", action: "wait", reason: "" }),
  exitJudgment: exitJudgmentSchema.default({ action: "hold", reason: "" }),
  riskFactors: z.array(z.string()).default([]),
  scenarios: z.array(scenarioSchema).default([]),
  finalConclusion: z.string().default(""),
  tradingNote: z.string().default(""),
});

export const analyzeSymbolRequestSchema = z.object({
  symbol: z.string().min(1),
  market: z.string().nullable().optional(),
  currentPrice: z.number().nullable().optional(),
  averageBuyPrice: z.number().nullable().optional(),
  holdingQuantity: z.number().nullable().optional(),
  mode: modeSchema.default("swing"),
  userQuestion: z.string().nullable().optional(),
});

export type ChartAnalysisResult = z.infer<typeof chartAnalysisResultSchema>;
export type AnalyzeSymbolRequest = z.infer<typeof analyzeSymbolRequestSchema>;
