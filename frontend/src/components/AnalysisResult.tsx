import type { ChartAnalysisResult } from "../types/analysis";
import { DisclaimerBox } from "./DisclaimerBox";

const gradeStyle: Record<string, string> = {
  A: "bg-emerald-600",
  B: "bg-blue-600",
  C: "bg-amber-600",
  D: "bg-rose-600",
};

export function AnalysisResult({ result }: { result: ChartAnalysisResult }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800">
            {result.symbol} {result.timeframe ? `(${result.timeframe})` : ""}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{result.finalConclusion}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${gradeStyle[result.entryJudgment.grade]}`}>
          매수등급 {result.entryJudgment.grade}
        </span>
      </header>

      <section className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-3">
        <p className="text-sm text-slate-700">현재가: {result.currentPrice ?? "확인 필요"}</p>
        <p className="text-sm text-slate-700">추세: {result.trend}</p>
        <p className="text-sm text-slate-700">강도: {result.trendStrength}</p>
        <p className="text-sm text-slate-700">행동: {result.entryJudgment.action}</p>
        <p className="text-sm text-slate-700">손절: {result.entryJudgment.stopLoss ?? "확인 필요"}</p>
        <p className="text-sm text-slate-700">
          목표: {result.entryJudgment.targetPrice1 ?? "-"} / {result.entryJudgment.targetPrice2 ?? "-"}
        </p>
      </section>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-medium text-slate-700">상세 근거 보기</summary>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <p>매수 관점: {result.entryJudgment.reason}</p>
          <p>매도 관점: {result.exitJudgment.reason}</p>
          <p>거래량 해석: {result.volumeAnalysis.interpretation}</p>
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-medium text-slate-700">리스크 요인</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {result.riskFactors.map((risk, idx) => (
            <li key={`${risk}-${idx}`}>{risk}</li>
          ))}
        </ul>
      </details>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-medium text-slate-700">트레이딩 노트</summary>
        <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{result.tradingNote}</pre>
      </details>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-medium text-slate-700">시나리오</summary>
        <div className="mt-3 space-y-2">
          {result.scenarios.map((scenario, idx) => (
            <article key={`${scenario.scenarioName}-${idx}`} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">{scenario.scenarioName}</p>
              <p>조건: {scenario.condition}</p>
              <p>기대: {scenario.expectedMove}</p>
              <p>대응: {scenario.action}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-medium text-slate-700">지지/저항 레벨</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <article>
            <p className="font-medium text-slate-700">지지선</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {result.supportLevels.map((level, idx) => (
                <li key={`support-${idx}`}>
                  {level.label}: {level.price ?? "확인 필요"} ({level.reason})
                </li>
              ))}
            </ul>
          </article>
          <article>
            <p className="font-medium text-slate-700">저항선</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {result.resistanceLevels.map((level, idx) => (
                <li key={`resistance-${idx}`}>
                  {level.label}: {level.price ?? "확인 필요"} ({level.reason})
                </li>
              ))}
            </ul>
          </article>
        </div>
      </details>

      <DisclaimerBox />
    </section>
  );
}
