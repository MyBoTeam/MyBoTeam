import type * as React from 'react';

import { cn } from '../utils/cn';

function Sidebar({
  className,
  glow = false,
  ...props
}: React.ComponentProps<'aside'> & {
  glow?: boolean;
}) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        'flex h-screen w-64 flex-col',
        glow && 'shadow-lg shadow-primary-700/20',
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex h-16 items-center border-b px-6', className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex-1 overflow-y-auto px-4 py-4', className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn('flex h-16 items-center border-t px-6', className)}
      {...props}
    />
  );
}

function SidebarItem({
  className,
  active,
  ...props
}: React.ComponentProps<'div'> & {
  active?: boolean;
}) {
  return (
    <div
      data-slot="sidebar-item"
      data-active={active ? 'true' : undefined}
      className={cn(
        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50',
        className,
      )}
      {...props}
    />
  );
}

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem };
