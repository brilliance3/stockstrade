import type { TradingScenario } from "../types/analysis";

export function ScenarioCards({ scenarios }: { scenarios: TradingScenario[] }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h4 className="mb-3 font-semibold">시나리오</h4>
      <div className="grid gap-3 md:grid-cols-3">
        {scenarios.length === 0 && <p className="text-sm text-slate-400">생성된 시나리오가 없습니다.</p>}
        {scenarios.map((scenario, index) => (
          <article key={`${scenario.scenarioName}-${index}`} className="rounded border border-slate-700 p-3">
            <p className="font-medium">{scenario.scenarioName}</p>
            <p className="mt-1 text-sm text-slate-300">조건: {scenario.condition}</p>
            <p className="text-sm text-slate-300">예상: {scenario.expectedMove}</p>
            <p className="text-sm text-slate-200">행동: {scenario.action}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
