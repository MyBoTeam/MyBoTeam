'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import type { GlassCustomization } from '../../utils/glass-utils';
import { type HoverEffect, hoverEffects } from '../../utils/hover-effects';
import { Input as BaseInput } from '../ui/input';

export interface InputProps extends Omit<React.ComponentProps<typeof BaseInput>, 'glass'> {
  variant?: string;
  icon?: React.ReactNode;
  error?: boolean;
  hover?: HoverEffect;
  glass?: GlassCustomization;
}

/**
 * Glass UI Input - A beautifully designed input component with glassy effects
 * Built on top of the base Input component with enhanced visual styling
 *
 * @example
 * ```tsx
 * <Input
 *   glass={{
 *     color: "rgba(255, 255, 255, 0.15)",
 *     blur: 15,
 *     outline: "rgba(255, 255, 255, 0.3)"
 *   }}
 *   placeholder="Enter text..."
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant: _variant, icon, error, hover = 'none', glass: _glass, ...props }, ref) => {
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
