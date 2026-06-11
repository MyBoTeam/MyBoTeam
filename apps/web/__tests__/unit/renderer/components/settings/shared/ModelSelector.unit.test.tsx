import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModelSelector } from '@/pages/settings/providers/components/shared/ModelSelector';

let lastErrorMessage: string | undefined;

vi.mock('@/components/searchable-select', () => ({
  SearchableSelect: ({
    label,
    placeholder,
    testId,
    errorMessage,
  }: {
    label: string;
    placeholder: string;
    testId: string;
    errorMessage?: string;
  }) => {
    lastErrorMessage = errorMessage;
    return (
      <div data-testid={testId}>
        <span>{label}</span>
        <span>{placeholder}</span>
      </div>
    );
  },
}));

describe('ModelSelector', () => {
  beforeEach(() => {
    lastErrorMessage = undefined;
  });

  it('renders with models', () => {
    const { container } = render(
      <ModelSelector
        models={[{ value: 'm1', label: 'Model 1' }]}
        value={null}
        onChange={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-testid="model-selector"]')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <ModelSelector models={[]} value={null} onChange={vi.fn()} loading={true} />,
    );
    expect(container.querySelector('[data-testid="model-selector"]')).toBeInTheDocument();
  });

  it('passes errorMessage when error is true and value is null', () => {
    render(
      <ModelSelector
        models={[]}
        value={null}
        onChange={vi.fn()}
        error={true}
        errorMessage="Custom error"
      />,
    );
    expect(lastErrorMessage).toBe('Custom error');
  });

  it('does not pass errorMessage when error is true but value is set', () => {
    render(
      <ModelSelector
        models={[]}
        value="m1"
        onChange={vi.fn()}
        error={true}
        errorMessage="Custom error"
      />,
    );
    expect(lastErrorMessage).toBeUndefined();
  });
});
