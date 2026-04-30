import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { analyzeChartImage, analyzeSymbol, saveHistory } from "../api/analysisApi";
import type { ChartAnalysisResult, SymbolAnalyzePayload } from "../types/analysis";
import { AnalysisResult } from "../components/AnalysisResult";

type Mode = SymbolAnalyzePayload["mode"];

const initialSymbolForm: SymbolAnalyzePayload = {
  symbol: "",
  market: "미국",
  currentPrice: null,
  averageBuyPrice: null,
  holdingQuantity: null,
  mode: "swing",
  userQuestion: "",
};

export function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("swing");
  const [file, setFile] = useState<File | null>(null);
  const [symbolForm, setSymbolForm] = useState<SymbolAnalyzePayload>(initialSymbolForm);
  const [result, setResult] = useState<ChartAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const symbol = searchParams.get("symbol");
    const question = searchParams.get("q");
    setSymbolForm((prev) => ({
      ...prev,
      symbol: symbol ? symbol.toUpperCase() : prev.symbol,
      userQuestion: question ?? prev.userQuestion,
    }));
  }, [searchParams]);

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
    <main className="mx-auto min-h-screen w-full max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-2">
        <h2 className="mr-4 text-2xl font-semibold text-slate-700">FPT</h2>
        <Link
          to="/"
          className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-3 text-left text-slate-500 shadow-sm"
        >
          새로운 분석 검색
        </Link>
        <div className="flex gap-2">
          <Link to="/" className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            홈
          </Link>
          <Link to="/history" className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            기록
          </Link>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="종목명 (예: QQQ)"
            className="md:col-span-2 rounded-full border border-slate-300 px-4 py-2 text-sm"
            value={symbolForm.symbol}
            onChange={(e) => setSymbolForm((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
          />
          <select
            className="rounded-full border border-slate-300 px-4 py-2 text-sm"
            value={symbolForm.market}
            onChange={(e) => setSymbolForm((prev) => ({ ...prev, market: e.target.value }))}
          >
            <option value="미국">미국</option>
            <option value="한국">한국</option>
            <option value="일본">일본</option>
          </select>
          <select
            className="rounded-full border border-slate-300 px-4 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="swing">스윙</option>
            <option value="longterm">장기</option>
            <option value="daytrade">단기</option>
          </select>
        </div>

        <textarea
          placeholder="질문을 입력하세요. 예) 지금은 관망이 좋을까요?"
          className="mt-3 w-full rounded-2xl border border-slate-300 p-3 text-sm"
          value={symbolForm.userQuestion ?? ""}
          onChange={(e) => setSymbolForm((prev) => ({ ...prev, userQuestion: e.target.value }))}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={runSymbolAnalysis}
            className="rounded-full bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            disabled={loading}
          >
            종목 분석
          </button>
          <button
            type="button"
            onClick={runImageAnalysis}
            className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            disabled={loading}
          >
            이미지 분석
          </button>
        </div>
      </section>

      {loading && <p className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-slate-600">분석 중입니다...</p>}
      {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</p>}
      {result && <AnalysisResult result={result} />}
    </main>
  );
}
