import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertCallout } from '@/components/settings/shared/AlertCallout';

describe('AlertCallout', () => {
  it('renders with title and detail', () => {
    render(<AlertCallout variant="warning" title="Warning Title" detail="Something is wrong" />);
    expect(screen.getByText('Warning Title')).toBeInTheDocument();
    expect(screen.getByText('Something is wrong')).toBeInTheDocument();
  });

  it('renders info variant', () => {
    render(<AlertCallout variant="info" title="Info" detail="Just so you know" />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('renders warning variant with destructive styling', () => {
    const { container } = render(
      <AlertCallout variant="warning" title="Warning" detail="Be careful" />,
    );
    expect(container.querySelector('[class*="destructive"]')).toBeTruthy();
  });
});
