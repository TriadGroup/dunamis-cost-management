interface SliderFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export const SliderField = ({ label, value, min = -100, max = 300, step = 1, onChange }: SliderFieldProps) => {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-fern-800/70">
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider-range h-3 w-full cursor-pointer appearance-none rounded-full"
      />
    </label>
  );
};
