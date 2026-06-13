'use client';

import type * as React from 'react';
import { cn } from '../utils/cn';

function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.ComponentProps<'div'> & {
  shimmer?: boolean;
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-muted',
        shimmer &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_2s_infinite]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
