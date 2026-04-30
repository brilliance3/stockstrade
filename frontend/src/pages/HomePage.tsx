import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-10 text-5xl font-semibold tracking-tight text-slate-800">First Principle Trader</h1>
      <Link
        to="/analyze"
        className="w-full max-w-2xl rounded-full border border-slate-200 bg-white px-8 py-4 text-lg text-slate-600 shadow-sm transition hover:shadow-md"
      >
        종목명 또는 차트 이미지를 입력해 분석 시작
      </Link>
      <div className="mt-8 flex gap-3">
        <Link to="/analyze" className="rounded bg-slate-100 px-5 py-2 text-sm text-slate-700 hover:bg-slate-200">
          검색
        </Link>
        <Link to="/history" className="rounded bg-slate-100 px-5 py-2 text-sm text-slate-700 hover:bg-slate-200">
          최근 분석
        </Link>
      </div>
    </main>
  );
}
