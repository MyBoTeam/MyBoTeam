'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { ScrollArea as BaseScrollArea, ScrollBar } from '../ui/scroll-area';

export interface ScrollAreaProps extends React.ComponentProps<typeof BaseScrollArea> {
  variant?: string;
  glow?: boolean;
}

/**
 * Glass UI Scroll Area - Enhanced scroll area with glassy effects
 */
export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof BaseScrollArea>,
  ScrollAreaProps
>(({ className, variant: _variant, glow = false, ...props }, ref) => {
  return (
    <BaseScrollArea
      ref={ref}
      className={cn(glow && 'shadow-md shadow-purple-500/20', className)}
      {...props}
    />
  );
});
ScrollArea.displayName = 'ScrollArea';

export { ScrollBar };
