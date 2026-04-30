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
  const currentPrice = input.currentPrice ?? null;
  const waitingMessage =
    "백엔드가 연결되지 않아 데모 분석 결과를 표시합니다. 실제 분석을 위해 VITE_API_BASE_URL 설정이 필요합니다.";

  return {
    success: true,
    analysisId: `demo-${Date.now()}`,
    result: {
      symbol,
      market: input.market ?? "UNKNOWN",
      timeframe: input.mode === "daytrade" ? "1H" : "1D",
      currentPrice,
      trend: "unknown",
      trendStrength: "unknown",
      supportLevels: [],
      resistanceLevels: [],
      volumeAnalysis: {
        visible: false,
        interpretation: "데모 모드에서는 거래량 분석이 비활성화됩니다.",
        recentVolumeTrend: "unknown",
        warning: waitingMessage,
      },
      entryJudgment: {
        grade: "C",
        action: "wait",
        reason: waitingMessage,
        idealEntryZone: "백엔드 연결 후 계산",
        stopLoss: null,
        targetPrice1: null,
        targetPrice2: null,
        riskRewardRatio: "계산 불가",
      },
      exitJudgment: {
        action: "hold",
        reason: "데모 모드에서는 실제 매도 판단이 제공되지 않습니다.",
        invalidationPrice: null,
        profitTakingZone: "백엔드 연결 후 계산",
      },
      riskFactors: [
        waitingMessage,
        `요청 소스: ${input.source}`,
        input.note ? `사용자 메모: ${input.note}` : "사용자 메모 없음",
      ],
      scenarios: [
        {
          scenarioName: "데모 모드",
          condition: "VITE_API_BASE_URL 미설정",
          expectedMove: "실제 차트 해석 미실행",
          action: "백엔드 URL 설정 후 재시도",
        },
      ],
      finalConclusion: waitingMessage,
      tradingNote:
        "- 현재 결과는 데모 모드\n- 저장소 Variables 또는 frontend/.env에 VITE_API_BASE_URL 설정\n- 배포 재실행 후 실제 분석 가능",
    },
  };
}
