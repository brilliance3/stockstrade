export function TradingNote({ note }: { note: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(note);
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">투자노트</h4>
        <button
          type="button"
          onClick={copy}
          className="rounded bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600"
        >
          복사
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-slate-200">{note}</pre>
    </section>
  );
}
