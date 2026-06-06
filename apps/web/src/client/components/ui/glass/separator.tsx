import * as React from 'react';
import { Separator as BaseSeparator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface SeparatorProps
  extends Omit<React.ComponentProps<typeof BaseSeparator>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const Separator = React.forwardRef<React.ElementRef<typeof BaseSeparator>, SeparatorProps>(
  ({ className, variant = 'glass', glow = false, ...props }, ref) => {
    return (
      <BaseSeparator
        ref={ref}
        className={cn(variantStyles[variant], glow && 'shadow-sm shadow-purple-500/20', className)}
        {...props}
      />
    );
  },
);
Separator.displayName = 'Separator';
