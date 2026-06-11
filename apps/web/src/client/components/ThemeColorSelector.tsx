import { Check } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeColor } from '@/utils/theme-color';
import { cn } from '@/utils/utils';

const colorOptions: { value: ThemeColor; label: string; bg: string }[] = [
  { value: 'mint', label: 'Mint', bg: '#53D3B1' },
  { value: 'blue', label: 'Blue', bg: '#7FB9FF' },
  { value: 'lemon', label: 'Lemon', bg: '#E6FF66' },
  { value: 'peach', label: 'Peach', bg: '#FFA07A' },
  { value: 'lavender', label: 'Lavender', bg: '#B3A3FF' },
  { value: 'neutral', label: 'Neutral', bg: '#A0A8B4' },
];

export function ThemeColorSelector() {
  const { themeColor, changeThemeColor } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {colorOptions.map((option) => (
        <button
          key={option.value}
          data-testid={`theme-color-${option.value}`}
          onClick={() => changeThemeColor(option.value)}
          onMouseEnter={() => setHovered(option.value)}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            'h-3.5 w-3.5 rounded-full transition-all duration-200',
            'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            themeColor === option.value
              ? 'ring-[1.5px] ring-offset-[2px] ring-foreground scale-110'
              : 'ring-[1px] ring-border/40 hover:scale-110 hover:ring-foreground/60',
          )}
          style={{ backgroundColor: option.bg }}
          title={option.label}
          aria-label={option.label}
        >
          {themeColor === option.value && (
            <Check
              weight="bold"
              className="h-full w-full p-[1.5px]"
              style={{
                color: option.value === 'lemon' ? '#4A5568' : 'white',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
