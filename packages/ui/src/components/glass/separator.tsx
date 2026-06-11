import * as React from 'react';
import { cn } from '../../utils/cn';
import { Separator as BaseSeparator } from '../ui/separator';

export interface SeparatorProps extends React.ComponentProps<typeof BaseSeparator> {
  variant?: string;
  glow?: boolean;
}

/**
 * Glass UI Separator - Enhanced separator with glassy effects
 */
export const Separator = React.forwardRef<React.ElementRef<typeof BaseSeparator>, SeparatorProps>(
  ({ className, variant: _variant, glow = false, ...props }, ref) => {
    return (
      <BaseSeparator
        ref={ref}
        className={cn(glow && 'shadow-sm shadow-purple-500/20', className)}
        {...props}
      />
    );
  },
);
Separator.displayName = 'Separator';
