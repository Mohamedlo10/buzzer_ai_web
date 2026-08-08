export interface SummaryRow {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  valueColor: string;
}

export function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden p-0 flex flex-col">
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 ${i < rows.length - 1 ? 'border-b border-line' : ''
            }`}
        >
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `color-mix(in srgb, ${row.iconColor} 16%, var(--surface-2))`,
              color: row.iconColor,
            }}
          >
            {row.icon}
          </div>
          <span className="text-[13px] text-txt-60 flex-1">{row.label}</span>
          <span
            className="text-[13.5px] font-bold"
            style={{ color: row.valueColor }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
