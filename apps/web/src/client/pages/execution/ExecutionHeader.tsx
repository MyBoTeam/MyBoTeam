import type { TaskStatus } from '@myboteam/agent-core';
import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';

export function ExecutionHeader({ prompt, status }: { prompt: string; status: TaskStatus }) {
  const navigate = useNavigate();

  return (
    <div className="flex-shrink-0 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between mx-auto">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            aria-label="Back"
            className="shrink-0 no-drag"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h1 className="text-base font-medium text-foreground truncate min-w-0">{prompt}</h1>
            <span data-testid="execution-status-badge">
              <StatusBadge status={status} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
