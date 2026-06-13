import type * as React from 'react';

import { cn } from '../utils/cn';
import { type GlassCustomization, getGlassStyles } from '../utils/glass-utils';
import { type HoverEffect, hoverEffects } from '../utils/hover-effects';

function ButtonGroup({
  className,
  effect = 'none',
  glass,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> & {
  effect?: HoverEffect;
  glass?: GlassCustomization;
  orientation?: 'horizontal' | 'vertical';
}) {
  const glassStyles = glass ? getGlassStyles(glass) : {};

  return (
    <div
      data-slot="button-group"
      className={cn(
        'inline-flex rounded-md',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        'relative overflow-hidden',
        hoverEffects({ hover: effect }),
        className,
      )}
      style={glassStyles}
      {...props}
    />
  );
}

export { ButtonGroup };
