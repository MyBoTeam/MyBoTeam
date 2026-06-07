import * as React from 'react';
import {
  DropdownMenu as BaseDropdownMenu,
  DropdownMenuContent as BaseDropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/utils';

export interface DropdownMenuContentProps
  extends Omit<React.ComponentProps<typeof BaseDropdownMenuContent>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof BaseDropdownMenuContent>,
  DropdownMenuContentProps
>(({ className, variant = 'glass', glow = false, ...props }, ref) => {
  return (
    <BaseDropdownMenuContent
      ref={ref}
      className={cn(variantStyles[variant], glow && 'shadow-lg shadow-purple-500/30', className)}
      {...props}
    />
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export {
  BaseDropdownMenu as DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
