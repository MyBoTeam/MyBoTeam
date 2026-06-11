import * as React from 'react';
import { cn } from '../../utils/cn';
import { Switch as BaseSwitch } from '../ui/switch';

export interface SwitchProps extends React.ComponentProps<typeof BaseSwitch> {
  variant?: string;
  glow?: boolean;
}

/**
 * Glass UI Switch - Enhanced switch with glassy effects
 */
export const Switch = React.forwardRef<React.ElementRef<typeof BaseSwitch>, SwitchProps>(
  ({ className, variant: _variant, glow = false, ...props }, ref) => {
    return (
      <BaseSwitch
        ref={ref}
        className={cn(
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
