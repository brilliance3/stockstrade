import type { PriceLevel } from "../types/analysis";

interface PriceLevelsProps {
  title: string;
  levels: PriceLevel[];
}

export function PriceLevels({ title, levels }: PriceLevelsProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h4 className="mb-3 font-semibold">{title}</h4>
      <div className="space-y-2">
        {levels.length === 0 && <p className="text-sm text-slate-400">인식된 구간이 없습니다.</p>}
        {levels.map((level, index) => (
          <article key={`${level.label}-${index}`} className="rounded border border-slate-700 p-3">
            <p className="font-medium">
              {level.label}: {level.price ?? "확인 필요"}
            </p>
            <p className="text-sm text-slate-300">{level.reason}</p>
            <p className="text-xs text-slate-400">신뢰도: {level.confidence}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
