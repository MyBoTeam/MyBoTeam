'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { type HoverEffect, hoverEffects } from '../../utils/hover-effects';
import { Tabs as BaseTabs, TabsList as BaseTabsList, TabsContent, TabsTrigger } from '../ui/tabs';

export interface TabsListProps extends Omit<React.ComponentProps<typeof BaseTabsList>, 'variant'> {
  glow?: boolean;
  hover?: HoverEffect;
  variant?: 'default' | 'glass' | 'line';
}

/**
 * Glass UI Tabs - Enhanced tabs with glassy effects
 */
export const TabsList = React.forwardRef<React.ElementRef<typeof BaseTabsList>, TabsListProps>(
  ({ className, variant: _variant, glow = false, hover = 'none', ...props }, ref) => {
    return (
      <BaseTabsList
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          glow && 'shadow-lg shadow-purple-500/20',
          hoverEffects({ hover }),
          className,
        )}
        {...props}
      />
    );
  },
);
TabsList.displayName = 'TabsList';

export { BaseTabs as Tabs, TabsContent, TabsTrigger };
