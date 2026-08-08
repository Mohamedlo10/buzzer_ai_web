export function ToggleRow({
  icon,
  label,
  sub,
  checked,
  onChange,
  accent = 'var(--team, var(--indigo))',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-[13px] px-[15px] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-txt font-bold text-[14px] leading-tight">{label}</p>
          <p className="text-[11px] text-txt-40 mt-1 leading-tight">{sub}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-7 w-12 items-center rounded-[14px] transition-colors duration-200 shrink-0"
        style={{
          backgroundColor: checked ? accent : 'var(--surface-2)',
        }}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  );
}
