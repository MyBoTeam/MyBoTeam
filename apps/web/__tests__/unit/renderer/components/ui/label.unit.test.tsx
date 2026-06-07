import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders', () => {
    const { container } = render(<Label>Name</Label>);
    expect(container.querySelector('label')).toBeInTheDocument();
  });

  it('renders children', () => {
    const { container } = render(<Label>Email</Label>);
    expect(container.querySelector('label')).toHaveTextContent('Email');
  });

  it('applies custom className', () => {
    const { container } = render(<Label className="custom">x</Label>);
    expect(container.querySelector('label')).toHaveClass('custom');
  });
});
