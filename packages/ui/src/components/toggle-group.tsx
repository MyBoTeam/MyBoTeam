'use client';

import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type * as React from 'react';

import { cn } from '../utils/cn';

function ToggleGroup({
  className,
  glow = false,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  glow?: boolean;
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        glow && 'shadow-md shadow-primary-700/20',
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-foreground data-[state=on]:shadow-sm hover:bg-accent/50 hover:text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
