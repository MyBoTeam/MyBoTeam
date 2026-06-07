import { useExecutionActions } from './useExecutionActions';
import { useExecutionCore } from './useExecutionCore';

export function useExecutionPage() {
  const core = useExecutionCore();
  const actions = useExecutionActions(core);
  return { ...core, ...actions };
}
