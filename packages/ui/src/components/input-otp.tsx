'use client';

import { OTPInput, type SlotProps } from 'input-otp';
import * as React from 'react';

import { cn } from '../utils/cn';

const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  Omit<React.ComponentPropsWithoutRef<typeof OTPInput>, 'children'> & {
    glow?: boolean;
  }
>(({ className, glow = false, render, containerClassName, ...props }, ref) => {
  const defaultRender = (renderProps: { slots: SlotProps[] }) => (
    <InputOTPGroup glow={glow}>
      {renderProps.slots.map((slot, index) => {
        // biome-ignore lint/suspicious/noArrayIndexKey: OTP slots are static
        return <InputOTPSlot key={index} {...slot} glow={glow} />;
      })}
    </InputOTPGroup>
  );

  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        'flex items-center gap-2',
        glow && 'shadow-md shadow-primary-700/20',
        containerClassName,
        className,
      )}
      render={render || defaultRender}
      {...props}
    />
  );
});
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & {
    glow?: boolean;
  }
>(({ className, glow = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-1', glow && 'shadow-md shadow-primary-700/20', className)}
    {...props}
  />
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
  React.ComponentRef<'div'>,
  SlotProps &
    React.ComponentPropsWithoutRef<'div'> & {
      glow?: boolean;
    }
>(
  (
    { glow = false, className, char, isActive, hasFakeCaret, placeholderChar = '○', ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center border-y border-r border-input text-lg font-semibold text-foreground transition-all first:rounded-l-md first:border-l last:rounded-r-md',
          isActive && 'z-10 opacity-100 ring-2 ring-ring ring-offset-background',
          !char && !isActive && 'opacity-70',
          glow && 'ring-1 ring-primary-700/20',
          className,
        )}
        {...props}
      >
        <span className={cn('font-semibold text-foreground', !char && 'text-muted-foreground')}>
          {char ?? placeholderChar}
        </span>
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-0.5 animate-pulse bg-foreground" />
          </div>
        )}
      </div>
    );
  },
);
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
  React.ComponentRef<'hr'>,
  React.ComponentPropsWithoutRef<'hr'>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn('inline-block h-6 w-px border-none bg-border', className)}
    {...props}
  />
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
