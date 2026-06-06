import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProviderFormHeader } from '@/components/settings/shared/ProviderFormHeader';

describe('ProviderFormHeader', () => {
  it('renders provider name in settings title', () => {
    render(<ProviderFormHeader logoSrc="/test-logo.svg" providerName="Test Provider" />);
    expect(screen.getByText('Test Provider Settings')).toBeInTheDocument();
  });

  it('renders logo image', () => {
    render(<ProviderFormHeader logoSrc="/test-logo.svg" providerName="Test Provider" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/test-logo.svg');
  });

  it('renders with invertInDark class when specified', () => {
    render(
      <ProviderFormHeader
        logoSrc="/test-logo.svg"
        providerName="Test Provider"
        invertInDark={true}
      />,
    );
    const img = screen.getByRole('img');
    expect(img.className).toContain('dark:invert');
  });

  it('renders without invertInDark class when not specified', () => {
    render(<ProviderFormHeader logoSrc="/test-logo.svg" providerName="Test" />);
    const img = screen.getByRole('img');
    expect(img.className).not.toContain('dark:invert');
  });
});
