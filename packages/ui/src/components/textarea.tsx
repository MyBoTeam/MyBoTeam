import type * as React from 'react';

import { cn } from '../utils/cn';

function Textarea({
  className,
  icon,
  error,
  ...props
}: React.ComponentProps<'textarea'> & {
  icon?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="relative">
      {icon && <div className="absolute left-3 top-3 text-muted-foreground">{icon}</div>}
      <textarea
        data-slot="textarea"
        className={cn(
          'flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          icon && 'pl-10',
          error && 'border-destructive focus-visible:ring-destructive',
          'transition-all duration-200 focus-visible:scale-[1.01]',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { Textarea };
