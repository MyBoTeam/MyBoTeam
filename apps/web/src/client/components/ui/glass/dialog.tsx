import * as React from 'react';
import {
  Dialog as BaseDialog,
  DialogContent as BaseDialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { GlassCustomization } from '@/lib/glass-utils';
import { type HoverEffect, hoverEffects } from '@/lib/hover-effects';
import { cn } from '@/lib/utils';

export interface DialogContentProps
  extends Omit<React.ComponentProps<typeof BaseDialogContent>, 'variant' | 'glass'> {
  variant?: 'default' | 'glass' | 'frosted' | 'fluted' | 'crystal';
  animated?: boolean;
  hover?: HoverEffect;
  glass?: GlassCustomization;
}

const variantStyles: Record<string, string> = {
  default: '',
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialogContent>,
  DialogContentProps
>(
  (
    { className, variant = 'glass', animated = true, hover = 'none', glass, children, ...props },
    ref,
  ) => {
    return (
      <BaseDialogContent
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          variantStyles[variant],
          animated && 'backdrop-blur-[var(--blur-lg)]',
          hoverEffects({ hover }),
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialogContent>
    );
  },
);
DialogContent.displayName = 'DialogContent';

export {
  BaseDialog as Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
