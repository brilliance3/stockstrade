import { OpenAI } from "openai";
import type { AnalyzeSymbolRequest, ChartAnalysisResult } from "./schema.js";
import { chartAnalysisResultSchema } from "./schema.js";
import { buildChartImagePrompt, buildSymbolPrompt, buildSystemPrompt } from "./prompt.js";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. Firebase Functions secret/config를 확인해주세요.");
  }
  return new OpenAI({ apiKey, timeout: 100000, maxRetries: 1 });
}

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

function safeJsonParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const stripped = text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    try {
      return JSON.parse(stripped) as Record<string, unknown>;
    } catch {
      const start = stripped.indexOf("{");
      const end = stripped.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
      }
      throw new Error("AI 응답을 JSON으로 파싱할 수 없습니다.");
    }
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

  const response = useWebSearch
    ? await client.responses.create({ model: MODEL, input, tools: [{ type: "web_search_preview" }] })
    : await client.responses.create({ model: MODEL, input });
  const parsed = safeJsonParse(response.output_text);
  const result = chartAnalysisResultSchema.parse(parsed);
  if (isLowSignalResult(result)) {
    throw new Error("모델 응답 품질이 낮아 fallback 분석으로 전환합니다.");
  }
  return result;
}

export function buildFallbackFromSymbol(payload: AnalyzeSymbolRequest): ChartAnalysisResult {
  const basePrice = payload.currentPrice ?? (payload.market === "한국" ? 70000 : 200);
  const support1 = roundPrice(basePrice * 0.96);
  const support2 = roundPrice(basePrice * 0.92);
  const resistance1 = roundPrice(basePrice * 1.05);
  const resistance2 = roundPrice(basePrice * 1.1);
  const stopLoss = roundPrice(basePrice * 0.94);
  const target1 = roundPrice(basePrice * 1.07);
  const target2 = roundPrice(basePrice * 1.13);

  return {
    symbol: payload.symbol,
    market: payload.market ?? null,
    timeframe: payload.mode === "daytrade" ? "4H" : "1D",
    currentPrice: basePrice,
    trend: "sideways",
    trendStrength: "weak",
    supportLevels: [
      { price: support1, label: "1차 지지", reason: "현재가 대비 -4% 구간", confidence: "medium" },
      { price: support2, label: "2차 지지", reason: "현재가 대비 -8% 구간", confidence: "low" },
    ],
    resistanceLevels: [
      { price: resistance1, label: "1차 저항", reason: "현재가 대비 +5% 구간", confidence: "medium" },
      { price: resistance2, label: "2차 저항", reason: "현재가 대비 +10% 구간", confidence: "low" },
    ],
    volumeAnalysis: {
      visible: true,
      interpretation: "실시간 거래량 원천이 없어 보수적 중립으로 평가했습니다.",
      recentVolumeTrend: "neutral",
      warning: "외부 시세/재무 데이터 연동 전 임시 분석입니다.",
    },
    entryJudgment: {
      grade: "C",
      action: "wait",
      reason: "지지 구간 확인 전 무리한 추격 매수는 비권장입니다.",
      idealEntryZone: `${support1} ~ ${support2}`,
      stopLoss,
      targetPrice1: target1,
      targetPrice2: target2,
      riskRewardRatio: "1.8 : 1",
    },
    exitJudgment: {
      action: "hold",
      reason: "저항대 접근 시 분할 익절, 손절선 이탈 시 리스크 축소 관점입니다.",
      invalidationPrice: stopLoss,
      profitTakingZone: `${target1} ~ ${target2}`,
    },
    riskFactors: [
      "S-RIM 산출에 필요한 재무 데이터(자기자본/ROE/r)가 미입력 상태입니다.",
      "실시간 차트 이미지가 없어 SYSTEM 8.0 트리거 검증 정확도가 제한됩니다.",
      payload.userQuestion ? `사용자 질문: ${payload.userQuestion}` : "사용자 질문 없음",
    ],
    scenarios: [
      {
        scenarioName: "상방 시나리오",
        condition: `${resistance1} 돌파 + 거래량 증가`,
        expectedMove: `${target1} ~ ${target2} 확장`,
        action: "분할 보유/추가 진입 검토",
      },
      {
        scenarioName: "중립 시나리오",
        condition: `${support1} ~ ${resistance1} 박스권`,
        expectedMove: "방향성 부재",
        action: "관망 및 트리거 대기",
      },
      {
        scenarioName: "하방 시나리오",
        condition: `${stopLoss} 이탈`,
        expectedMove: `${support2} 재시험`,
        action: "손절 또는 비중 축소",
      },
    ],
    finalConclusion: "API fallback 분석 결과입니다. 실시간 재무/차트 데이터 연동 시 정밀도가 개선됩니다.",
    tradingNote: `- 현재가 기준: ${basePrice}\n- 매수 대기 구간: ${support1} ~ ${support2}\n- 손절 기준: ${stopLoss}\n- 목표 구간: ${target1} / ${target2}`,
  };
}

export function buildFallbackFromImage(mode: string, userNote?: string): ChartAnalysisResult {
  return {
    symbol: "IMAGE",
    market: null,
    timeframe: mode === "daytrade" ? "4H" : "1D",
    currentPrice: null,
    trend: "unknown",
    trendStrength: "unknown",
    supportLevels: [],
    resistanceLevels: [],
    volumeAnalysis: {
      visible: false,
      interpretation: "이미지 기반 AI 분석을 완료하지 못했습니다.",
      recentVolumeTrend: "unknown",
      warning: "OPENAI_API_KEY 또는 모델 응답 문제로 fallback 결과를 제공합니다.",
    },
    entryJudgment: {
      grade: "C",
      action: "wait",
      reason: "핵심 데이터 부족으로 관망이 우선입니다.",
    },
    exitJudgment: {
      action: "hold",
      reason: "명확한 추세 확인 전까지 보수적으로 관리합니다.",
    },
    riskFactors: [
      "이미지 분석 모델 응답을 확보하지 못했습니다.",
      userNote ? `사용자 메모: ${userNote}` : "사용자 메모 없음",
    ],
    scenarios: [],
    finalConclusion: "이미지 분석 API fallback 결과입니다. 환경변수 또는 모델 상태를 확인한 뒤 재분석이 필요합니다.",
    tradingNote: "- 이미지 재업로드 후 재분석\n- API 키/모델 설정 확인",
  };
}

function roundPrice(price: number): number {
  if (price >= 1000) return Math.round(price);
  return Number(price.toFixed(2));
}

function isLowSignalResult(result: ChartAnalysisResult): boolean {
  const entryReason = result.entryJudgment.reason?.trim() ?? "";
  const hasLevels = result.supportLevels.length + result.resistanceLevels.length > 0;
  const hasRisks = result.riskFactors.length > 0;
  return entryReason.length < 8 && !hasLevels && !hasRisks;
}

export function newAnalysisId(): string {
  return Math.random().toString(16).slice(2, 12);
}
