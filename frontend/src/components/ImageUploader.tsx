import { useMemo } from "react";

interface ImageUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function ImageUploader({ file, onFileChange }: ImageUploaderProps) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="mb-3 text-lg font-semibold">차트 이미지 업로드</h3>
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        className="mb-3 block w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm"
      />
      <p className="mb-3 text-xs text-slate-400">
        권장: 종목명, 현재가, 캔들, 거래량이 함께 보이는 차트
      </p>
      {preview && (
        <img src={preview} alt="chart preview" className="max-h-80 w-full rounded object-contain" />
      )}
    </section>
  );
}
