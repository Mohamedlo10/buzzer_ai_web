'use client';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  suffix?: string;
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  suffix = '',
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleDecrease = () => {
    if (value > min) onValueChange(Math.max(min, value - step));
  };

  const handleIncrease = () => {
    if (value < max) onValueChange(Math.min(max, value + step));
  };

  return (
    <div className="mb-6">
      <div className="flex flex-row items-center justify-between mb-3">
        <span className="text-white/80 text-sm font-medium">{label}</span>
        <span className="text-[#00D397] font-bold text-lg">
          {value}{suffix}
        </span>
      </div>

      <div className="flex flex-row items-center gap-4">
        {/* Decrease button */}
        <button
          onClick={handleDecrease}
          disabled={value <= min}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${
            value <= min
              ? 'bg-[#3E3666]/50 text-white/30 cursor-not-allowed'
              : 'bg-[#3E3666] text-white hover:bg-[#4E4676] cursor-pointer'
          }`}
        >
          −
        </button>

        {/* Slider track + native range input */}
        <div className="flex-1 relative h-2 bg-[#3E3666] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#00D397]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="sr-only"
          aria-label={label}
        />

        {/* Increase button */}
        <button
          onClick={handleIncrease}
          disabled={value >= max}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${
            value >= max
              ? 'bg-[#3E3666]/50 text-white/30 cursor-not-allowed'
              : 'bg-[#3E3666] text-white hover:bg-[#4E4676] cursor-pointer'
          }`}
        >
          +
        </button>
      </div>

      {/* Min/Max labels */}
      <div className="flex flex-row justify-between mt-2">
        <span className="text-white/40 text-xs">{min}{suffix}</span>
        <span className="text-white/40 text-xs">{max}{suffix}</span>
      </div>
    </div>
  );
}
