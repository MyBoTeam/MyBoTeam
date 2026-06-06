/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

describe('Avatar', () => {
  it('renders', () => {
    const { container } = render(<Avatar />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders children', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('AB')).toBeInTheDocument();
  });
});

describe('AvatarImage', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="test.jpg" />
      </Avatar>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('AvatarFallback', () => {
  it('renders fallback', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild?.firstChild).toBeInTheDocument();
  });

  it('renders children text', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
