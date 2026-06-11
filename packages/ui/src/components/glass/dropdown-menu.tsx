import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  DropdownMenu as BaseDropdownMenu,
  DropdownMenuContent as BaseDropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface DropdownMenuContentProps
  extends React.ComponentProps<typeof BaseDropdownMenuContent> {
  variant?: string;
  glow?: boolean;
}

/**
 * Glass UI Dropdown Menu - Enhanced dropdown menu with glassy effects
 */
export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof BaseDropdownMenuContent>,
  DropdownMenuContentProps
>(({ className, variant: _variant, glow = false, ...props }, ref) => {
  return (
    <BaseDropdownMenuContent
      ref={ref}
      className={cn(glow && 'shadow-lg shadow-purple-500/30', className)}
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
