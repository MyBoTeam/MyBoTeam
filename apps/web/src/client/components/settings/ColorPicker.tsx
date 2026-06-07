export const WORKSPACE_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
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
