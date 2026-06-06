import * as React from 'react';
import { AlertDescription, AlertTitle, Alert as BaseAlert } from '@/components/ui/alert';
import { type HoverEffect, hoverEffects } from '@/lib/hover-effects';
import { cn } from '@/lib/utils';

export interface AlertProps extends Omit<React.ComponentProps<typeof BaseAlert>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  glow?: boolean;
  hover?: HoverEffect;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'glass', glow = false, hover = 'none', ...props }, ref) => {
    return (
      <BaseAlert
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          variantStyles[variant],
          glow && 'shadow-lg shadow-purple-500/20',
          'transition-all duration-200',
          hoverEffects({ hover }),
          className,
        )}
        {...props}
      />
    );
  },
);
Alert.displayName = 'Alert';

export { AlertDescription, AlertTitle };
