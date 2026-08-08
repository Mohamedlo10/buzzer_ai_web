export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < step;
        return (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isFilled ? 'var(--primary)' : 'var(--surface-2)',
              opacity: isFilled ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
