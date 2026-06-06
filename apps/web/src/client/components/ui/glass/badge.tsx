import type * as React from 'react';
import { Badge as BaseBadge } from '@/components/ui/badge';
import { type HoverEffect, hoverEffects } from '@/lib/hover-effects';
import { cn } from '@/lib/utils';

export interface BadgeProps extends Omit<React.ComponentProps<typeof BaseBadge>, 'variant'> {
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

export function Badge({
  className,
  variant = 'glass',
  glow = false,
  hover = 'none',
  ...props
}: BadgeProps) {
  return (
    <BaseBadge
      className={cn(
        'relative overflow-hidden',
        variantStyles[variant],
        glow && 'shadow-lg shadow-purple-500/30',
        'transition-all duration-200',
        hoverEffects({ hover }),
        className,
      )}
      {...props}
    />
  );
}
