export function StepperField({
  label,
  value,
  suffix = '',
  min,
  max,
  step = 1,
  onChange,
  accent = 'var(--accent, var(--primary))',
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  accent?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col justify-between min-h-[92px]">
      <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-2 leading-none">{label}</p>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="w-9 h-9 rounded-full bg-surface-2 border border-line flex items-center justify-center text-txt text-lg font-bold hover:bg-surface-3 active:scale-95 transition-all shrink-0 disabled:opacity-[0.38] disabled:cursor-not-allowed"
        >
          −
        </button>
        <span
          className="font-bold text-[22px] flex-1 text-center font-mono leading-none"
          style={{ color: accent }}
        >
          {value}{suffix}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="w-9 h-9 rounded-full bg-surface-2 border border-line flex items-center justify-center text-txt text-lg font-bold hover:bg-surface-3 active:scale-95 transition-all shrink-0 disabled:opacity-[0.38] disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
