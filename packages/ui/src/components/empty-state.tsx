import type * as React from 'react';

import { cn } from '../utils/cn';
import { type GlassCustomization, getGlassStyles } from '../utils/glass-utils';
import { type HoverEffect, hoverEffects } from '../utils/hover-effects';

function EmptyState({
  className,
  effect = 'none',
  glass,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  effect?: HoverEffect;
  glass?: GlassCustomization;
}) {
  const glassStyles = glass ? getGlassStyles(glass) : {};

  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl p-12 text-center',
        'relative overflow-hidden',
        hoverEffects({ hover: effect }),
        className,
      )}
      style={glassStyles}
      {...props}
    >
      {children}
    </div>
  );
}

function EmptyStateIcon({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-state-icon"
      className={cn('mb-4 text-muted-foreground', className)}
      {...props}
    />
  );
}

function EmptyStateTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="empty-state-title"
      className={cn('mb-2 text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function EmptyStateDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn('max-w-sm text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle };
