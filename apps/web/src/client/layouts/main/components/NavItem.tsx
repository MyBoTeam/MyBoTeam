import { Tooltip, TooltipContent, TooltipTrigger } from '@myboteam/ui';

('use client');

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/utils/utils';

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

export function NavItem({ href, icon, label, isCollapsed, isActive }: NavItemProps) {
  const navigate = useNavigate();
  const content = (
    <button
      onClick={() => navigate(href)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
        isCollapsed ? 'justify-center' : '',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent',
      )}
    >
      <span className="flex items-center justify-center w-5 h-5 shrink-0">{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );

  if (!isCollapsed) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
