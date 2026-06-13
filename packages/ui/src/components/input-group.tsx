import type * as React from 'react';

import { cn } from '../utils/cn';
import { type GlassCustomization, getGlassStyles } from '../utils/glass-utils';
import { type HoverEffect, hoverEffects } from '../utils/hover-effects';

function InputGroup({
  className,
  effect = 'none',
  glass,
  ...props
}: React.ComponentProps<'div'> & {
  effect?: HoverEffect;
  glass?: GlassCustomization;
}) {
  const glassStyles = glass ? getGlassStyles(glass) : {};

  return (
    <div
      data-slot="input-group"
      className={cn(
        'inline-flex items-center rounded-md',
        'relative overflow-hidden',
        hoverEffects({ hover: effect }),
        className,
      )}
      style={glassStyles}
      {...props}
    />
  );
}

export { InputGroup };
