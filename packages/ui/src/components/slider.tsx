'use client';

import { Slider as SliderPrimitive } from 'radix-ui';
import type * as React from 'react';

import { cn } from '../utils/cn';

function Slider({
  className,
  glow = false,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  glow?: boolean;
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        glow && 'shadow-md shadow-primary-700/20',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
