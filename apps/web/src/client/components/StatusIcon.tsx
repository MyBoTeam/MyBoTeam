import type { TodoItem } from '@myboteam/agent-core/common';
import { CheckCircle, Circle, SpinnerGap, XCircle } from '@phosphor-icons/react';

export function StatusIcon({ status }: { status: TodoItem['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-foreground shrink-0 mt-px" />;
    case 'in_progress':
      return <SpinnerGap className="h-4 w-4 text-muted-foreground shrink-0 mt-px animate-spin" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-px" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-px" />;
  }
}
