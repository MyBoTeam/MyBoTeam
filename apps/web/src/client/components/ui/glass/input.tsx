import * as React from 'react';
import { Input as BaseInput } from '@/components/ui/input';
import type { GlassCustomization } from '@/lib/glass-utils';
import { type HoverEffect, hoverEffects } from '@/lib/hover-effects';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.ComponentProps<typeof BaseInput>, 'variant' | 'glass'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  icon?: React.ReactNode;
  error?: boolean;
  hover?: HoverEffect;
  glass?: GlassCustomization;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'glass', icon, error, hover = 'none', glass, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <BaseInput
          ref={ref}
          className={cn(
            'relative overflow-hidden',
            variantStyles[variant],
            icon && 'pl-10',
            error && 'border-destructive focus-visible:ring-destructive',
            'transition-all duration-200 focus-visible:scale-[1.02]',
            hoverEffects({ hover }),
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';
