export function ChoiceStrip({
  label,
  value,
  options,
  onChange,
  accent = 'var(--primary)',
}: {
  label: string;
  value: number | null;
  options: { label: string; value: number | null }[];
  onChange: (val: number | null) => void;
  accent?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col">
      <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase mb-3 leading-none">{label}</p>
      <div className="flex gap-2">
        {options.map((opt, i) => {
          const isActive = value === opt.value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border"
              style={{
                borderColor: isActive ? accent : 'var(--line)',
                color: isActive ? accent : 'var(--txt-60)',
                backgroundColor: isActive
                  ? `color-mix(in srgb, ${accent} 16%, var(--surface))`
                  : 'var(--surface)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
