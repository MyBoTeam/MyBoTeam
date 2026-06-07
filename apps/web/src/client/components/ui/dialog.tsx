import { X } from '@phosphor-icons/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { GlassCustomization } from '@/lib/glass-utils';
import { getGlassStyles } from '@/lib/glass-utils';
import { cn } from '@/lib/utils';

const DialogAnimationContext = React.createContext<{ isOpen: boolean }>({ isOpen: false });

const EXIT_ANIMATION_DURATION = 100;

const glassDialogVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-background',
      glass: 'glass-bg',
      frosted: 'glass-frosted',
      fluted: 'glass-fluted',
      crystal: 'glass-crystal',
    },
  },
  defaultVariants: {
    variant: 'glass',
  },
});

function Dialog({
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [shouldShow, setShouldShow] = React.useState(!!open);

  React.useEffect(() => {
    if (open) {
      setShouldShow(true);
    } else if (shouldShow) {
      const timer = setTimeout(() => setShouldShow(false), EXIT_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [open, shouldShow]);

  return (
    <DialogAnimationContext.Provider value={{ isOpen: !!open }}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={shouldShow}
        onOpenChange={onOpenChange}
        {...props}
      />
    </DialogAnimationContext.Provider>
  );
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof glassDialogVariants> {
  glass?: GlassCustomization;
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, variant, glass, style, ...props }, ref) => {
  const { t } = useTranslation('common');
  const { isOpen } = React.useContext(DialogAnimationContext);
  const glassStyles = getGlassStyles(glass);

  return (
    <DialogPortal>
      <DialogPrimitive.Overlay asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: EXIT_ANIMATION_DURATION / 1000 }}
          className="fixed inset-0 z-50 bg-white/60 glass-bg backdrop-blur-[12px]"
        />
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        aria-describedby={undefined}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{
            opacity: isOpen ? 1 : 0,
            scale: isOpen ? 1 : 0.95,
            y: isOpen ? 0 : -10,
          }}
          transition={{ duration: EXIT_ANIMATION_DURATION / 1000, ease: 'easeOut' }}
          className={cn(
            'relative grid w-full max-w-lg gap-4 border p-6 shadow-lg sm:rounded-lg',
            glassDialogVariants({ variant }),
            className,
          )}
          style={{ ...glassStyles, ...style }}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">{t('buttons.close')}</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
