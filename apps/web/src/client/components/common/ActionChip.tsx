import { Code } from '@phosphor-icons/react';
import type { BrowserAction } from './BrowserScriptCardHelpers';
import { ACTION_ICONS, formatActionLabel } from './BrowserScriptCardHelpers';

export function ActionChip({
  action,
  t,
}: {
  action: BrowserAction;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}) {
  const Icon = ACTION_ICONS[action.action] || Code;
  const label = formatActionLabel(action, t);

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
      <Icon className="h-3 w-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
