import type { ChartAnalysisResult } from "../types/analysis";
import { PriceLevels } from "./PriceLevels";
import { ScenarioCards } from "./ScenarioCards";
import { RiskPanel } from "./RiskPanel";
import { TradingNote } from "./TradingNote";
import { DisclaimerBox } from "./DisclaimerBox";

const gradeStyle: Record<string, string> = {
  A: "bg-emerald-600",
  B: "bg-blue-600",
  C: "bg-amber-600",
  D: "bg-rose-600",
};

export function AnalysisResult({ result }: { result: ChartAnalysisResult }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">
            {result.symbol} {result.timeframe ? `(${result.timeframe})` : ""}
          </h3>
          <p className="text-sm text-slate-300">{result.finalConclusion}</p>
        </div>
        <span className={`rounded px-3 py-1 text-sm font-semibold ${gradeStyle[result.entryJudgment.grade]}`}>
          매수등급 {result.entryJudgment.grade}
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <PriceLevels title="지지선" levels={result.supportLevels} />
        <PriceLevels title="저항선" levels={result.resistanceLevels} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h4 className="mb-2 font-semibold">매수 관점</h4>
          <p className="text-sm text-slate-300">{result.entryJudgment.reason}</p>
          <p className="mt-2 text-sm">손절 기준: {result.entryJudgment.stopLoss ?? "확인 필요"}</p>
          <p className="text-sm">
            목표가: {result.entryJudgment.targetPrice1 ?? "-"} / {result.entryJudgment.targetPrice2 ?? "-"}
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h4 className="mb-2 font-semibold">매도 관점</h4>
          <p className="text-sm text-slate-300">{result.exitJudgment.reason}</p>
          <p className="mt-2 text-sm">행동: {result.exitJudgment.action}</p>
        </section>
      </div>

      <RiskPanel riskFactors={result.riskFactors} />
      <ScenarioCards scenarios={result.scenarios} />
      <TradingNote note={result.tradingNote} />
      <DisclaimerBox />
    </section>
  );
}
