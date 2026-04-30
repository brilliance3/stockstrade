export function RiskPanel({ riskFactors }: { riskFactors: string[] }) {
  return (
    <section className="rounded-xl border border-amber-600/40 bg-amber-900/20 p-4">
      <h4 className="mb-2 font-semibold text-amber-200">리스크 요인</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-100">
        {riskFactors.length === 0 && <li>현재 명확한 추가 리스크 요인이 없습니다.</li>}
        {riskFactors.map((risk, index) => (
          <li key={`${risk}-${index}`}>{risk}</li>
        ))}
      </ul>
    </section>
  );
}
