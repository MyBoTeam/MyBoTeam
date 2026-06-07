import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectButton } from '@/pages/settings/providers/components/shared/ConnectButton';

describe('ConnectButton', () => {
  it('renders connect button', () => {
    const onClick = vi.fn();
    render(<ConnectButton onClick={onClick} connecting={false} />);
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('shows connecting state', () => {
    const onClick = vi.fn();
    const { container } = render(<ConnectButton onClick={onClick} connecting={true} />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls onClick when not connecting', () => {
    const onClick = vi.fn();
    render(<ConnectButton onClick={onClick} connecting={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when connecting', () => {
    const onClick = vi.fn();
    render(<ConnectButton onClick={onClick} connecting={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(<ConnectButton onClick={onClick} connecting={false} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
