import { Link } from "react-router-dom";
import { loadHistory } from "../api/analysisApi";

export function HistoryPage() {
  const items = loadHistory();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">최근 분석 기록</h2>
        <Link to="/analyze" className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          분석 페이지
        </Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-slate-400">저장된 분석 기록이 없습니다.</p>}
        {items.map((item, index) => (
          <article
            key={`${item.symbol}-${item.createdAt}-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
            <h3 className="text-lg font-semibold text-slate-800">{item.symbol}</h3>
            <p className="text-sm text-slate-600">{item.finalConclusion}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
