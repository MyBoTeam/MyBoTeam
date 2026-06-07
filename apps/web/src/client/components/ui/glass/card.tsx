import * as React from 'react';
import {
  Card as BaseCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { GlassCustomization } from '@/utils/glass-utils';
import { type HoverEffect, hoverEffects } from '@/utils/hover-effects';
import { cn } from '@/utils/utils';

export interface CardProps extends Omit<React.ComponentProps<typeof BaseCard>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  gradient?: boolean;
  animated?: boolean;
  hover?: HoverEffect;
  glass?: GlassCustomization;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'glass',
      gradient = false,
      animated = false,
      hover = 'none',
      glass,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <BaseCard
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          variantStyles[variant],
          gradient && 'bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10',
          animated &&
            'transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--glass-shadow-lg)]',
          hoverEffects({ hover }),
          className,
        )}
        {...props}
      >
        {children}
      </BaseCard>
    );
  },
);
Card.displayName = 'Card';

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
