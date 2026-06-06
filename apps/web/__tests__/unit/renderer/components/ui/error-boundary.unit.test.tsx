/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const map: Record<string, string> = {
        'boundary.unexpectedError': 'An unexpected error occurred',
        'boundary.compactMessage': 'Error:',
        'boundary.title': 'Something went wrong',
        'boundary.tryAgain': 'Try Again',
        'buttons.retry': 'Retry',
      };
      return map[key] ?? fallback ?? key;
    },
  }),
}));

import { DefaultFallback, ErrorBoundary } from '@/components/ui/ErrorBoundary';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.stubGlobal('import', { meta: { env: { DEV: false } } });
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('catches errors and shows default fallback', () => {
    const ThrowError = () => {
      throw new Error('boom');
    };

    // Suppress console.error from React
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const ThrowError = () => {
      throw new Error('custom error');
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <span>Custom: {error.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom: custom error')).toBeInTheDocument();
  });

  it('reset function clears the error', () => {
    let shouldThrow = true;
    const MaybeThrow = () => {
      if (shouldThrow) throw new Error('fail');
      return <div>recovered</div>;
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary
        fallback={(_error, reset) => (
          <div>
            <span>Error</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <MaybeThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Reset'));
  });
});

describe('DefaultFallback', () => {
  it('renders error message', () => {
    render(<DefaultFallback error={new Error('test error')} reset={() => {}} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('test error')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<DefaultFallback error={new Error('err')} reset={() => {}} compact />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls reset when retry button is clicked', () => {
    const reset = vi.fn();
    render(<DefaultFallback error={new Error('err')} reset={reset} compact />);
    fireEvent.click(screen.getByText('Retry'));
    expect(reset).toHaveBeenCalled();
  });
});
