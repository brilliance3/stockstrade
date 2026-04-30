import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState("");
  const [question, setQuestion] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (symbol.trim()) params.set("symbol", symbol.trim().toUpperCase());
    if (question.trim()) params.set("q", question.trim());
    navigate(`/analyze${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-10 text-5xl font-semibold tracking-tight text-slate-800">First Principle Trader</h1>
      <form
        onSubmit={handleSearch}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full rounded-full border border-slate-300 px-5 py-3 text-base text-slate-700"
          placeholder="종목명 입력 (예: QQQ)"
        />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-3 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-700"
          placeholder="질문 입력 (예: 지금 진입해도 될까?)"
          rows={3}
        />
        <div className="mt-4 flex gap-3">
          <button type="submit" className="rounded bg-slate-100 px-5 py-2 text-sm text-slate-700 hover:bg-slate-200">
            분석 시작
          </button>
          <Link to="/history" className="rounded bg-slate-100 px-5 py-2 text-sm text-slate-700 hover:bg-slate-200">
            최근 분석
          </Link>
        </div>
      </form>
      <div className="mt-6 flex gap-3">
        <Link to="/analyze" className="rounded bg-slate-100 px-5 py-2 text-sm text-slate-700 hover:bg-slate-200">
          검색
        </Link>
      </div>
    </main>
  );
}
