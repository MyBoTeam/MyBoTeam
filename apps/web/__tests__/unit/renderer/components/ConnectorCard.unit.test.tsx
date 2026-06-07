import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectorCard } from '@/pages/settings/connectors/components/ConnectorCard';

describe('ConnectorCard', () => {
  const baseConnector = {
    id: 'c1',
    name: 'Test Connector',
    url: 'http://example.com/mcp',
    status: 'connected' as const,
    isEnabled: true,
  };

  const defaultProps = {
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    onToggleEnabled: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders connector name', () => {
    render(<ConnectorCard connector={baseConnector} {...defaultProps} />);
    expect(screen.getByText('Test Connector')).toBeInTheDocument();
  });

  it('shows hostname extracted from url', () => {
    render(<ConnectorCard connector={baseConnector} {...defaultProps} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('shows url as-is when it cannot be parsed', () => {
    render(<ConnectorCard connector={{ ...baseConnector, url: 'not-a-url' }} {...defaultProps} />);
    expect(screen.getByText('not-a-url')).toBeInTheDocument();
  });

  it('shows Connected status for connected connector', () => {
    render(<ConnectorCard connector={baseConnector} {...defaultProps} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows Disconnected status for disconnected connector', () => {
    render(
      <ConnectorCard connector={{ ...baseConnector, status: 'disconnected' }} {...defaultProps} />,
    );
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows Error status for error connector', () => {
    render(<ConnectorCard connector={{ ...baseConnector, status: 'error' }} {...defaultProps} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows Connecting status for connecting connector', () => {
    render(
      <ConnectorCard connector={{ ...baseConnector, status: 'connecting' }} {...defaultProps} />,
    );
    const matches = screen.getAllByText('Connecting...');
    expect(matches.length).toBe(2);
  });

  it('shows connect button when status is disconnected', () => {
    render(
      <ConnectorCard connector={{ ...baseConnector, status: 'disconnected' }} {...defaultProps} />,
    );
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('shows disconnect button when status is connected', () => {
    render(<ConnectorCard connector={baseConnector} {...defaultProps} />);
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('shows disabled connecting button when status is connecting', () => {
    render(
      <ConnectorCard connector={{ ...baseConnector, status: 'connecting' }} {...defaultProps} />,
    );
    const buttons = screen.getAllByRole('button');
    const connectingBtn = buttons.find((b) => b.hasAttribute('disabled'));
    expect(connectingBtn).toBeInTheDocument();
  });
});
