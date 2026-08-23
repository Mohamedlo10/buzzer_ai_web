export function Spinner({ text = 'Chargement...' }: { text?: string; size?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-host border-t-transparent rounded-full animate-spin" />
      {text && <p className="text-txt-60 text-xs font-medium">{text}</p>}
    </div>
  );
}
