import type * as React from 'react';

import { cn } from '../utils/cn';

function Spinner({
  className,
  size = 'md',
  glow = false,
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div
      data-slot="spinner"
      data-size={size}
      className={cn(
        'inline-block animate-spin rounded-full border-t-transparent border-r-transparent border-primary',
        sizeClasses[size],
        glow && 'shadow-lg shadow-primary-700/30',
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
