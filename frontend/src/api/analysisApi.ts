import type {
  AnalysisApiResponse,
  ChartAnalysisResult,
  SymbolAnalyzePayload,
} from "../types/analysis";

const JSON_HEADERS = { "Content-Type": "application/json" };
const HISTORY_KEY = "fpt_analysis_history";
const REQUEST_TIMEOUT_MS = 20000;

function resolveApiBaseUrl(): string | null {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envBase && envBase.trim().length > 0) {
    return envBase.replace(/\/+$/, "");
  }
  // Dev uses Vite proxy; production without backend falls back to demo response.
  return import.meta.env.PROD ? null : "";
}

function withApiBase(path: string): string {
  const base = resolveApiBaseUrl();
  if (base === null) {
    return path;
  }
  return `${base}${path}`;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 서버 상태를 확인해주세요.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function analyzeChartImage(
  image: File,
  mode: SymbolAnalyzePayload["mode"],
  userNote?: string,
): Promise<AnalysisApiResponse> {
  const apiBase = resolveApiBaseUrl();
  if (apiBase === null) {
    return buildDemoResponse({
      symbol: "IMAGE",
      market: "UNKNOWN",
      mode,
      note: userNote,
      source: "image",
    });
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("mode", mode);
  if (userNote) formData.append("userNote", userNote);

  const response = await fetchWithTimeout(withApiBase("/api/analyze/chart-image"), {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
}

export async function analyzeSymbol(
  payload: SymbolAnalyzePayload,
): Promise<AnalysisApiResponse> {
  const apiBase = resolveApiBaseUrl();
  if (apiBase === null) {
    return buildDemoResponse({
      symbol: payload.symbol,
      market: payload.market,
      mode: payload.mode,
      note: payload.userQuestion,
      source: "symbol",
      currentPrice: payload.currentPrice ?? null,
    });
  }

  const response = await fetchWithTimeout(withApiBase("/api/analyze/symbol"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export function saveHistory(item: ChartAnalysisResult) {
  const history = loadHistory();
  const next = [{ ...item, createdAt: new Date().toISOString() }, ...history].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function loadHistory(): Array<ChartAnalysisResult & { createdAt: string }> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function handleResponse(response: Response): Promise<AnalysisApiResponse> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("서버 응답을 읽을 수 없습니다. 백엔드 주소/배포 상태를 확인해주세요.");
  }
  const body = (data ?? {}) as Record<string, unknown>;
  if (!response.ok || !body.success) {
    throw new Error(
      (body.detail as string) ?? (body.message as string) ?? "분석 요청에 실패했습니다.",
    );
  }
  return data as AnalysisApiResponse;
}

function buildDemoResponse(input: {
  symbol: string;
  market?: string;
  mode: SymbolAnalyzePayload["mode"];
  note?: string;
  source: "image" | "symbol";
  currentPrice?: number | null;
}): AnalysisApiResponse {
  const symbol = (input.symbol || "UNKNOWN").toUpperCase();
  const guessedPrice = input.source === "image" ? 100 : 50000;
  const currentPrice = input.currentPrice ?? guessedPrice;
  const waitingMessage =
    "백엔드가 연결되지 않아 데모 분석 결과를 표시합니다. 실제 분석을 위해 VITE_API_BASE_URL 설정이 필요합니다.";
  const support1 = roundPrice(currentPrice * 0.95);
  const support2 = roundPrice(currentPrice * 0.9);
  const resistance1 = roundPrice(currentPrice * 1.04);
  const resistance2 = roundPrice(currentPrice * 1.08);
  const stopLoss = roundPrice(currentPrice * 0.93);
  const target1 = roundPrice(currentPrice * 1.06);
  const target2 = roundPrice(currentPrice * 1.12);
  const trend = input.mode === "longterm" ? "uptrend" : "sideways";
  const trendStrength = input.mode === "daytrade" ? "weak" : "medium";
  const entryGrade = input.mode === "daytrade" ? "C" : "B";
  const riskReward = calcRiskReward(currentPrice, stopLoss, target1);

  return {
    success: true,
    analysisId: `demo-${Date.now()}`,
    result: {
      symbol,
      market: input.market ?? "UNKNOWN",
      timeframe: input.mode === "daytrade" ? "1H" : "1D",
      currentPrice,
      trend,
      trendStrength,
      supportLevels: [
        {
          price: support1,
          label: "1차 지지",
          reason: "현재가 기준 -5% 구간(데모 계산)",
          confidence: "medium",
        },
        {
          price: support2,
          label: "2차 지지",
          reason: "현재가 기준 -10% 구간(데모 계산)",
          confidence: "low",
        },
      ],
      resistanceLevels: [
        {
          price: resistance1,
          label: "1차 저항",
          reason: "현재가 기준 +4% 구간(데모 계산)",
          confidence: "medium",
        },
        {
          price: resistance2,
          label: "2차 저항",
          reason: "현재가 기준 +8% 구간(데모 계산)",
          confidence: "low",
        },
      ],
      volumeAnalysis: {
        visible: true,
        interpretation: "거래량은 중립으로 가정했습니다(백엔드 미연결 데모).",
        recentVolumeTrend: "neutral",
        warning: waitingMessage,
      },
      entryJudgment: {
        grade: entryGrade,
        action: "wait",
        reason: "현재 구간은 데모 계산상 관찰 우선입니다. 지지 확인 후 분할 접근이 유리합니다.",
        idealEntryZone: `${support1} ~ ${support2}`,
        stopLoss,
        targetPrice1: target1,
        targetPrice2: target2,
        riskRewardRatio: riskReward,
      },
      exitJudgment: {
        action: "hold",
        reason: "추세가 유지되는 동안 보유, 저항 접근 시 분할 익절 관점입니다(데모 계산).",
        invalidationPrice: stopLoss,
        profitTakingZone: `${target1} ~ ${target2}`,
      },
      riskFactors: [
        waitingMessage,
        `요청 소스: ${input.source}`,
        input.note ? `사용자 메모: ${input.note}` : "사용자 메모 없음",
        "실제 차트 캔들/거래량 인식은 백엔드 연결 후 제공됩니다.",
      ],
      scenarios: [
        {
          scenarioName: "상방 시나리오",
          condition: `${resistance1} 상향 돌파`,
          expectedMove: `${target1} ~ ${target2} 구간 시도`,
          action: "보유 또는 눌림 재진입 관찰",
        },
        {
          scenarioName: "중립 시나리오",
          condition: `${support1} ~ ${resistance1} 박스권`,
          expectedMove: "횡보 지속 가능성",
          action: "관망, 거래량 동반 돌파 대기",
        },
        {
          scenarioName: "하방 시나리오",
          condition: `${stopLoss} 이탈`,
          expectedMove: `${support2} 재테스트 가능성`,
          action: "리스크 축소 및 재분석",
        },
      ],
      finalConclusion:
        "백엔드 미연결 상태에서 로컬 규칙 기반으로 계산된 임시 분석입니다. 실제 AI 차트 인식 결과와는 다를 수 있습니다.",
      tradingNote:
        `- 현재가: ${currentPrice}\n- 관심 구간: ${support1} ~ ${support2}\n- 손절 기준: ${stopLoss}\n- 목표 구간: ${target1} / ${target2}\n- 실제 분석 적용: VITE_API_BASE_URL 설정 후 재시도`,
    },
  };
}

function roundPrice(price: number): number {
  if (price >= 1000) return Math.round(price);
  return Number(price.toFixed(2));
}

function calcRiskReward(current: number, stopLoss: number, target: number): string {
  const risk = Math.max(current - stopLoss, 0.0001);
  const reward = Math.max(target - current, 0);
  return `${(reward / risk).toFixed(2)} : 1`;
}
