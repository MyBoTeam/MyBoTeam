import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectorList } from '@/components/settings/connectors/ConnectorList';

describe('ConnectorList', () => {
  const defaultProps = {
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    onToggleEnabled: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders empty state when no connectors', () => {
    render(<ConnectorList connectors={[]} {...defaultProps} />);
    expect(screen.getByText('No custom MCP servers added yet')).toBeInTheDocument();
  });

  it('renders connector cards when connectors exist', () => {
    const connectors = [
      { id: 'c1', name: 'Connector 1', url: 'http://example.com', enabled: true },
    ];
    const { container } = render(<ConnectorList connectors={connectors} {...defaultProps} />);
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });
});
