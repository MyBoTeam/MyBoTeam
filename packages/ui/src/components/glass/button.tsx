'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import type { GlassCustomization } from '../../utils/glass-utils';
import { type HoverEffect, hoverEffects } from '../../utils/hover-effects';
import { Button as BaseButton } from '../ui/button';

export interface ButtonProps extends Omit<React.ComponentProps<typeof BaseButton>, 'glass'> {
  effect?: HoverEffect;
  glass?: GlassCustomization;
}

/**
 * Glass UI Button - A beautifully designed button component with glassy effects
 * Built on top of the base Button component with enhanced visual effects
 *
 * @example
 * ```tsx
 * <Button
 *   glass={{
 *     color: "rgba(59, 130, 246, 0.2)",
 *     blur: 25,
 *     outline: "rgba(59, 130, 246, 0.4)"
 *   }}
 * >
 *   Click me
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, effect = 'glow', variant: _variant, glass: _glass, ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        className={cn('relative overflow-hidden', hoverEffects({ hover: effect }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
