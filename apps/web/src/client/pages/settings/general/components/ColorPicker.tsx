export const WORKSPACE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#64748b',
];

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      {WORKSPACE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onColorChange(color)}
          aria-label={`Select color ${color}`}
          aria-pressed={selectedColor === color}
          className={`h-5 w-5 rounded-full transition-transform ${
            selectedColor === color
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
