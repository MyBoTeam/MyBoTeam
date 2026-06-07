import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModelSelector } from '@/pages/settings/providers/components/shared/ModelSelector';

let lastErrorMessage: string | undefined;

vi.mock('@/components/ui/searchable-select', () => ({
  SearchableSelect: ({ testId, errorMessage }: { testId: string; errorMessage?: string }) => {
    lastErrorMessage = errorMessage;
    return <div data-testid={testId} />;
  },
}));

describe('ModelSelector error fallback', () => {
  beforeEach(() => {
    lastErrorMessage = undefined;
  });

  it('falls back to model.required when errorMessage not provided', () => {
    render(<ModelSelector models={[]} value={null} onChange={vi.fn()} error={true} />);
    expect(lastErrorMessage).toBe('Please select a model to continue');
  });
});
