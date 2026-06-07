import type * as React from 'react';
import { Skeleton as BaseSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/utils';

export interface SkeletonProps extends Omit<React.ComponentProps<typeof BaseSkeleton>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  shimmer?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export function Skeleton({
  className,
  variant = 'glass',
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <BaseSkeleton
      className={cn(
        variantStyles[variant],
        shimmer &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_2s_infinite]',
        className,
      )}
      {...props}
    />
  );
}
