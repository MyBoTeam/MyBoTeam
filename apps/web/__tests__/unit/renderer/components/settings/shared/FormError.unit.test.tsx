import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormError } from '@/pages/settings/providers/components/shared/FormError';

describe('FormError', () => {
  it('renders error message', () => {
    render(<FormError error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders nothing when error is null', () => {
    const { container } = render(<FormError error={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when error is empty string', () => {
    const { container } = render(<FormError error="" />);
    expect(container.innerHTML).toBe('');
  });
});
