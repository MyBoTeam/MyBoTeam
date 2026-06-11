'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import type { GlassCustomization } from '../../utils/glass-utils';
import { type HoverEffect, hoverEffects } from '../../utils/hover-effects';
import {
  Dialog as BaseDialog,
  DialogContent as BaseDialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

export interface DialogContentProps
  extends Omit<React.ComponentProps<typeof BaseDialogContent>, 'glass'> {
  variant?: 'default' | 'glass' | 'glassSubtle' | 'frosted' | 'fluted' | 'crystal';
  animated?: boolean;
  hover?: HoverEffect;
  glass?: GlassCustomization;
}

/**
 * Glass UI Dialog - Enhanced dialog with glassy effects and animations
 *
 * @example
 * ```tsx
 * <DialogContent
 *   glass={{
 *     color: "rgba(139, 92, 246, 0.15)",
 *     blur: 40,
 *     outline: "rgba(139, 92, 246, 0.3)"
 *   }}
 * >
 *   Dialog content
 * </DialogContent>
 * ```
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialogContent>,
  DialogContentProps
>(
  (
    {
      className,
      variant: _variant,
      animated = true,
      hover = 'none',
      glass: _glass,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <BaseDialogContent
        ref={ref}
        className={cn(
          'relative overflow-hidden',
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
