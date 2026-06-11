'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  Tooltip as BaseTooltip,
  TooltipContent as BaseTooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export interface TooltipContentProps extends React.ComponentProps<typeof BaseTooltipContent> {
  variant?: string;
  glow?: boolean;
}

/**
 * Glass UI Tooltip - Enhanced tooltip with glassy effects
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof BaseTooltipContent>,
  TooltipContentProps
>(({ className, variant: _variant, glow = false, ...props }, ref) => {
  return (
    <BaseTooltipContent
      ref={ref}
      className={cn(glow && 'shadow-lg shadow-purple-500/30', className)}
      {...props}
    />
  );
});
TooltipContent.displayName = 'TooltipContent';

export { BaseTooltip as Tooltip, TooltipProvider, TooltipTrigger };
