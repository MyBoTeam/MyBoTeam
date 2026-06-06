import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus } from '@/components/settings/shared/ConnectionStatus';

describe('ConnectionStatus', () => {
  it('returns null for disconnected status', () => {
    const { container } = render(<ConnectionStatus status="disconnected" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders connecting status', () => {
    render(<ConnectionStatus status="connecting" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<ConnectionStatus status="error" />);
    expect(screen.getByText('An error has occurred')).toBeInTheDocument();
  });

  it('renders connected status without disconnect button', () => {
    render(<ConnectionStatus status="connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.queryByTestId('disconnect-button')).not.toBeInTheDocument();
  });

  it('renders connected status with disconnect button', () => {
    const onDisconnect = vi.fn();
    render(<ConnectionStatus status="connected" onDisconnect={onDisconnect} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
  });
});
