import type * as React from 'react';
import { cn } from '../../utils/cn';
import { type HoverEffect, hoverEffects } from '../../utils/hover-effects';
import { Badge as BaseBadge } from '../ui/badge';

export interface BadgeProps extends React.ComponentProps<typeof BaseBadge> {
  glow?: boolean;
  hover?: HoverEffect;
}

/**
 * Glass UI Badge - Enhanced badge with glassy effects and glow option
 */
export function Badge({
  className,
  variant: _variant,
  glow = false,
  hover = 'none',
  ...props
}: BadgeProps) {
  return (
    <BaseBadge
      className={cn(
        'relative overflow-hidden',
        glow && 'shadow-lg shadow-purple-500/30',
        'transition-all duration-200',
        hoverEffects({ hover }),
        className,
      )}
      {...props}
    />
  );
}
