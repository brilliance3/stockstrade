import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-start justify-center gap-6 p-6">
      <p className="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300">First Principle Trader</p>
      <h1 className="text-4xl font-bold leading-tight text-slate-100">
        이미지 인식 기반 차트 분석 + 투자 원칙 기반 트레이딩 보조
      </h1>
      <p className="max-w-3xl text-slate-300">
        예측이 아니라 조건 판단에 집중합니다. 추세, 지지/저항, 거래량, 리스크를 기반으로 진입 여부를
        구조화해 제공합니다.
      </p>
      <div className="flex gap-3">
        <Link to="/analyze" className="rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500">
          분석 시작
        </Link>
        <Link to="/history" className="rounded border border-slate-600 px-4 py-2 hover:bg-slate-800">
          분석 기록
        </Link>
      </div>
    </main>
  );
}
