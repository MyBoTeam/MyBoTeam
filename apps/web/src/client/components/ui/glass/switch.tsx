import * as React from 'react';
import { Switch as BaseSwitch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.ComponentProps<typeof BaseSwitch>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const Switch = React.forwardRef<React.ElementRef<typeof BaseSwitch>, SwitchProps>(
  ({ className, variant = 'glass', glow = false, ...props }, ref) => {
    return (
      <BaseSwitch
        ref={ref}
        className={cn(
          variantStyles[variant],
          glow && 'data-[state=checked]:shadow-lg data-[state=checked]:shadow-purple-500/30',
          'transition-all duration-200',
          className,
        )}
        {...props}
      />
    );
  },
);
Switch.displayName = 'Switch';
