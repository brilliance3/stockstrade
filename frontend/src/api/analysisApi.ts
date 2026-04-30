import type {
  AnalysisApiResponse,
  ChartAnalysisResult,
  SymbolAnalyzePayload,
} from "../types/analysis";

const JSON_HEADERS = { "Content-Type": "application/json" };
const HISTORY_KEY = "fpt_analysis_history";
const SYMBOL_REQUEST_TIMEOUT_MS = 240000;
const IMAGE_REQUEST_TIMEOUT_MS = 300000;

function resolveApiBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envBase && envBase.trim().length > 0) {
    return envBase.replace(/\/+$/, "");
  }
  // Firebase Hosting rewrite defaults to same-origin /api.
  return "";
}

function withApiBase(path: string): string {
  return `${resolveApiBaseUrl()}${path}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fetch(url, init);
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("응답 지연이 길어 자동 중단되었습니다. 잠시 후 다시 시도해주세요.");
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
  const formData = new FormData();
  formData.append("image", image);
  formData.append("mode", mode);
  if (userNote) formData.append("userNote", userNote);

  const response = await fetchWithTimeout(withApiBase("/api/analyze/chart-image"), {
    method: "POST",
    body: formData,
  }, IMAGE_REQUEST_TIMEOUT_MS);
  return handleResponse(response);
}

export async function analyzeSymbol(
  payload: SymbolAnalyzePayload,
): Promise<AnalysisApiResponse> {
  const response = await fetchWithTimeout(withApiBase("/api/analyze/symbol"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  }, SYMBOL_REQUEST_TIMEOUT_MS);
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
    throw new Error("서버 응답을 읽을 수 없습니다. Firebase 배포 상태를 확인해주세요.");
  }
  const body = (data ?? {}) as Record<string, unknown>;
  if (!response.ok || !body.success) {
    throw new Error(
      (body.detail as string) ?? (body.message as string) ?? "분석 요청에 실패했습니다.",
    );
  }
  return data as AnalysisApiResponse;
}
