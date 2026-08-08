export function ModeCard({
  icon,
  label,
  sublabel,
  active,
  accent = 'var(--primary)',
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  accent?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[18px] border-2 p-4 text-left transition-all duration-180 flex flex-col justify-between h-[125px] shrink-0 ${active ? '' : 'border-line bg-surface'
        }`}
      style={{
        borderColor: active ? accent : 'var(--line)',
        backgroundColor: active
          ? `color-mix(in srgb, ${accent} 14%, var(--surface))`
          : 'var(--surface)',
      }}
    >
      <div
        className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center transition-all shrink-0 mb-2"
        style={{
          backgroundColor: active
            ? `color-mix(in srgb, ${accent} 22%, transparent)`
            : 'var(--surface-2)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[14.5px] font-bold transition-colors leading-tight"
          style={{ color: active ? accent : 'var(--txt)' }}
        >
          {label}
        </p>
        <p className="text-[11px] text-txt-40 mt-1 line-clamp-1">{sublabel}</p>
      </div>
    </button>
  );
}
