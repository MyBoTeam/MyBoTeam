'use client';

import type * as React from 'react';
import { cn } from '../../utils/cn';
import { Skeleton as BaseSkeleton } from '../ui/skeleton';

export interface SkeletonProps extends React.ComponentProps<typeof BaseSkeleton> {
  variant?: string;
  shimmer?: boolean;
}

/**
 * Glass UI Skeleton - Enhanced skeleton with glassy effects and shimmer
 */
export function Skeleton({
  className,
  variant: _variant,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <BaseSkeleton
      className={cn(
        shimmer &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_2s_infinite]',
        className,
      )}
      {...props}
    />
  );
}
