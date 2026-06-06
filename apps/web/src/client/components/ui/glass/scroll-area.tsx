import * as React from 'react';
import { ScrollArea as BaseScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps
  extends Omit<React.ComponentProps<typeof BaseScrollArea>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof BaseScrollArea>,
  ScrollAreaProps
>(({ className, variant = 'glass', glow = false, ...props }, ref) => {
  return (
    <BaseScrollArea
      ref={ref}
      className={cn(variantStyles[variant], glow && 'shadow-md shadow-purple-500/20', className)}
      {...props}
    />
  );
});
ScrollArea.displayName = 'ScrollArea';
