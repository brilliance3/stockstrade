import { useState } from "react";
import { Link } from "react-router-dom";
import { analyzeChartImage, analyzeSymbol, saveHistory } from "../api/analysisApi";
import type { ChartAnalysisResult, SymbolAnalyzePayload } from "../types/analysis";
import { ImageUploader } from "../components/ImageUploader";
import { AnalysisResult } from "../components/AnalysisResult";

type Mode = SymbolAnalyzePayload["mode"];

const initialSymbolForm: SymbolAnalyzePayload = {
  symbol: "",
  market: "NASDAQ",
  currentPrice: null,
  averageBuyPrice: null,
  holdingQuantity: null,
  mode: "swing",
  userQuestion: "",
};

export function AnalyzePage() {
  const [mode, setMode] = useState<Mode>("swing");
  const [file, setFile] = useState<File | null>(null);
  const [symbolForm, setSymbolForm] = useState<SymbolAnalyzePayload>(initialSymbolForm);
  const [result, setResult] = useState<ChartAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runImageAnalysis = async () => {
    if (!file) return setError("이미지를 먼저 선택해주세요.");
    setError("");
    setLoading(true);
    try {
      const response = await analyzeChartImage(file, mode);
      setResult(response.result);
      saveHistory(response.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const runSymbolAnalysis = async () => {
    if (!symbolForm.symbol) return setError("종목명을 입력해주세요.");
    setError("");
    setLoading(true);
    try {
      const response = await analyzeSymbol({ ...symbolForm, mode });
      setResult(response.result);
      saveHistory(response.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">차트 분석</h2>
        <div className="flex gap-2">
          <Link to="/" className="rounded border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800">
            홈
          </Link>
          <Link to="/history" className="rounded border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800">
            기록
          </Link>
        </div>
      </div>

      <section className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <label className="mb-2 block text-sm text-slate-300">분석 모드</label>
        <select
          className="rounded border border-slate-600 bg-slate-950 p-2"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="swing">스윙</option>
          <option value="longterm">장기</option>
          <option value="daytrade">단기</option>
          <option value="etf">ETF</option>
        </select>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ImageUploader file={file} onFileChange={setFile} />
          <button
            type="button"
            onClick={runImageAnalysis}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            이미지 분석하기
          </button>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="mb-3 text-lg font-semibold">종목 직접 입력 분석</h3>
            <div className="grid gap-2">
              <input
                placeholder="종목명 (예: QQQ)"
                className="rounded border border-slate-600 bg-slate-950 p-2 text-sm"
                value={symbolForm.symbol}
                onChange={(e) => setSymbolForm((prev) => ({ ...prev, symbol: e.target.value }))}
              />
              <input
                placeholder="시장 (예: NASDAQ)"
                className="rounded border border-slate-600 bg-slate-950 p-2 text-sm"
                value={symbolForm.market}
                onChange={(e) => setSymbolForm((prev) => ({ ...prev, market: e.target.value }))}
              />
              <input
                placeholder="현재가"
                className="rounded border border-slate-600 bg-slate-950 p-2 text-sm"
                type="number"
                value={symbolForm.currentPrice ?? ""}
                onChange={(e) =>
                  setSymbolForm((prev) => ({ ...prev, currentPrice: e.target.value ? Number(e.target.value) : null }))
                }
              />
              <textarea
                placeholder="질문 (예: 지금 보유해야 할까요?)"
                className="rounded border border-slate-600 bg-slate-950 p-2 text-sm"
                value={symbolForm.userQuestion ?? ""}
                onChange={(e) => setSymbolForm((prev) => ({ ...prev, userQuestion: e.target.value }))}
              />
            </div>
            <button
              type="button"
              onClick={runSymbolAnalysis}
              className="mt-3 w-full rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
              disabled={loading}
            >
              종목 분석하기
            </button>
          </section>
        </div>

        <div className="space-y-4">
          {loading && <p className="rounded border border-slate-700 bg-slate-900 p-3">분석 중입니다...</p>}
          {error && <p className="rounded border border-rose-700 bg-rose-900/20 p-3 text-rose-200">{error}</p>}
          {result && <AnalysisResult result={result} />}
        </div>
      </div>
    </main>
  );
}
