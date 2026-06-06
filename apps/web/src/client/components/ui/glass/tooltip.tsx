import * as React from 'react';
import {
  Tooltip as BaseTooltip,
  TooltipContent as BaseTooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface TooltipContentProps
  extends Omit<React.ComponentProps<typeof BaseTooltipContent>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof BaseTooltipContent>,
  TooltipContentProps
>(({ className, variant = 'glass', glow = false, ...props }, ref) => {
  return (
    <BaseTooltipContent
      ref={ref}
      className={cn(variantStyles[variant], glow && 'shadow-lg shadow-purple-500/30', className)}
      {...props}
    />
  );
});
TooltipContent.displayName = 'TooltipContent';

export { BaseTooltip as Tooltip, TooltipProvider, TooltipTrigger };
