import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectedControls } from '@/components/settings/shared/ConnectedControls';

describe('ConnectedControls', () => {
  it('renders connected status', () => {
    const onDisconnect = vi.fn();
    render(<ConnectedControls onDisconnect={onDisconnect} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('calls onDisconnect when disconnect button clicked', () => {
    const onDisconnect = vi.fn();
    render(<ConnectedControls onDisconnect={onDisconnect} />);
    const btn = screen.getByTestId('disconnect-button');
    fireEvent.click(btn);
    expect(onDisconnect).toHaveBeenCalled();
  });
});
