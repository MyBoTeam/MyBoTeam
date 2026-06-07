import type { TodoItem } from '@myboteam/agent-core/common';
import { cn } from '@/lib/utils';
import { StatusIcon } from './StatusIcon';

export function TodoListItem({ todo }: { todo: TodoItem }) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 rounded-lg pl-2 pr-1 py-3',
        todo.status === 'completed' && 'bg-todo-item-completed',
        todo.status === 'in_progress' && 'bg-todo-item-in-progress',
        todo.status === 'cancelled' && 'opacity-50',
      )}
    >
      <StatusIcon status={todo.status} />
      <span
        className={cn(
          'text-xs text-foreground leading-snug tracking-[0.18px]',
          todo.status === 'cancelled' && 'line-through text-muted-foreground',
        )}
      >
        {todo.content}
      </span>
    </li>
  );
}
