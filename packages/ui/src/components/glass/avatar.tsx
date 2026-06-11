'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { AvatarFallback, AvatarImage, Avatar as BaseAvatar } from '../ui/avatar';

export interface AvatarProps extends Omit<React.ComponentProps<typeof BaseAvatar>, 'size'> {
  glow?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Glass UI Avatar - Enhanced avatar with glassy effects
 */
export const Avatar = React.forwardRef<React.ElementRef<typeof BaseAvatar>, AvatarProps>(
  ({ className, glow = false, size: _size, ...props }, ref) => {
    const sizeClasses: Record<string, string> = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-16 w-16',
    };

    return (
      <BaseAvatar
        ref={ref}
        className={cn(
          sizeClasses[_size || 'md'],
          glow && 'ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20',
          'transition-all duration-200',
          className,
        )}
        {...props}
      />
    );
  },
);
Avatar.displayName = 'Avatar';

export { AvatarFallback, AvatarImage };
