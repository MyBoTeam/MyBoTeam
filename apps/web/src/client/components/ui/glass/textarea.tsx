import * as React from 'react';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface TextareaProps extends Omit<React.ComponentProps<typeof BaseTextarea>, 'variant'> {
  variant?: 'glass' | 'frosted' | 'fluted' | 'crystal';
  icon?: React.ReactNode;
  error?: boolean;
}

const variantStyles: Record<string, string> = {
  glass: 'glass-bg',
  frosted: 'glass-frosted',
  fluted: 'glass-fluted',
  crystal: 'glass-crystal',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'glass', icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-muted-foreground">{icon}</div>}
        <BaseTextarea
          ref={ref}
          className={cn(
            variantStyles[variant],
            icon && 'pl-10',
            error && 'border-destructive focus-visible:ring-destructive',
            'transition-all duration-200 focus-visible:scale-[1.01]',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
