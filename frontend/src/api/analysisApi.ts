import type {
  AnalysisApiResponse,
  ChartAnalysisResult,
  SymbolAnalyzePayload,
} from "../types/analysis";

const JSON_HEADERS = { "Content-Type": "application/json" };
const HISTORY_KEY = "fpt_analysis_history";

export async function analyzeChartImage(
  image: File,
  mode: SymbolAnalyzePayload["mode"],
  userNote?: string,
): Promise<AnalysisApiResponse> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("mode", mode);
  if (userNote) formData.append("userNote", userNote);

  const response = await fetch("/api/analyze/chart-image", {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
}

export async function analyzeSymbol(
  payload: SymbolAnalyzePayload,
): Promise<AnalysisApiResponse> {
  const response = await fetch("/api/analyze/symbol", {
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
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.detail ?? data.message ?? "분석 요청에 실패했습니다.");
  }
  return data as AnalysisApiResponse;
}
