import type * as React from 'react';
import {
  Tabs as BaseTabs,
  TabsList as BaseTabsList,
  TabsContent,
  TabsTrigger,
} from '@/components/ui/tabs';
import { type HoverEffect, hoverEffects } from '@/utils/hover-effects';
import { cn } from '@/utils/utils';

export interface TabsListProps extends Omit<React.ComponentProps<typeof BaseTabsList>, 'variant'> {
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

export function TabsList({
  className,
  variant = 'glass',
  glow = false,
  hover = 'none',
  ...props
}: TabsListProps) {
  return (
    <BaseTabsList
      className={cn(
        'relative overflow-hidden',
        variantStyles[variant],
        glow && 'shadow-lg shadow-purple-500/20',
        hoverEffects({ hover }),
        className,
      )}
      {...props}
    />
  );
}

export { BaseTabs as Tabs, TabsContent, TabsTrigger };
