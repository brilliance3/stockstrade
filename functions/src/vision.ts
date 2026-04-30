import { OpenAI } from "openai";
import type { AnalyzeSymbolRequest, ChartAnalysisResult } from "./schema.js";
import { chartAnalysisResultSchema } from "./schema.js";
import { buildChartImagePrompt, buildSymbolPrompt, buildSystemPrompt } from "./prompt.js";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. Firebase Functions secret/config를 확인해주세요.");
  }
  return new OpenAI({ apiKey });
}

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

function safeJsonParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const stripped = text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    return JSON.parse(stripped) as Record<string, unknown>;
  }
}

export async function analyzeChartImage(imageBytes: Buffer, mode: string, userNote?: string): Promise<ChartAnalysisResult> {
  const client = getClient();
  const b64 = imageBytes.toString("base64");
  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "user",
        content: [
          { type: "input_text", text: buildChartImagePrompt(mode, userNote) },
          { type: "input_image", image_url: `data:image/png;base64,${b64}`, detail: "auto" },
        ],
      },
    ],
  });
  const parsed = safeJsonParse(response.output_text);
  return chartAnalysisResultSchema.parse(parsed);
}

export async function analyzeSymbolInput(payload: AnalyzeSymbolRequest): Promise<ChartAnalysisResult> {
  const client = getClient();
  const referenceUrl = process.env.CHATGPT_REFERENCE_URL;
  const useWebSearch = (process.env.ENABLE_CHATGPT_WEB_SEARCH || "false").toLowerCase() === "true";
  const input = [
    { role: "system" as const, content: buildSystemPrompt() },
    { role: "user" as const, content: buildSymbolPrompt(payload, referenceUrl) },
  ];

  try {
    const response = useWebSearch
      ? await client.responses.create({ model: MODEL, input, tools: [{ type: "web_search_preview" }] })
      : await client.responses.create({ model: MODEL, input });
    const parsed = safeJsonParse(response.output_text);
    return chartAnalysisResultSchema.parse(parsed);
  } catch {
    const response = await client.responses.create({ model: MODEL, input });
    const parsed = safeJsonParse(response.output_text);
    return chartAnalysisResultSchema.parse(parsed);
  }
}

export function buildFallbackFromSymbol(payload: AnalyzeSymbolRequest): ChartAnalysisResult {
  return {
    symbol: payload.symbol,
    market: payload.market ?? null,
    timeframe: null,
    currentPrice: payload.currentPrice ?? null,
    trend: "unknown",
    trendStrength: "unknown",
    supportLevels: [],
    resistanceLevels: [],
    volumeAnalysis: {
      visible: false,
      interpretation: "",
      recentVolumeTrend: "unknown",
    },
    entryJudgment: {
      grade: "C",
      action: "wait",
      reason: "",
    },
    exitJudgment: {
      action: "hold",
      reason: "",
    },
    riskFactors: ["실시간 차트 이미지가 없어 추세/거래량 해석 정확도가 제한됩니다."],
    scenarios: [],
    finalConclusion: "입력 정보 기준으로는 조건부 관찰이 우선입니다.",
    tradingNote: "- 이미지 기반 확인 전 신규 진입 보류\n- 손절 기준을 먼저 정의",
  };
}

export function newAnalysisId(): string {
  return Math.random().toString(16).slice(2, 12);
}
