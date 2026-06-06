import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectorAddForm } from '@/components/settings/connectors/ConnectorAddForm';

describe('ConnectorAddForm', () => {
  const defaultProps = {
    url: '',
    adding: false,
    onUrlChange: vi.fn(),
    onAdd: vi.fn(),
    onKeyDown: vi.fn(),
  };

  it('renders add button', () => {
    render(<ConnectorAddForm {...defaultProps} />);
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('calls onUrlChange when input changes', () => {
    const onUrlChange = vi.fn();
    render(<ConnectorAddForm {...defaultProps} onUrlChange={onUrlChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'http://test.com' } });
    expect(onUrlChange).toHaveBeenCalledWith('http://test.com');
  });

  it('disables input while adding', () => {
    render(<ConnectorAddForm {...defaultProps} adding={true} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('disables add button when url is empty', () => {
    render(<ConnectorAddForm {...defaultProps} url="" />);
    const btn = screen.getByText('Add').closest('button');
    expect(btn).toBeDisabled();
  });

  it('enables add button when url is provided', () => {
    render(<ConnectorAddForm {...defaultProps} url="http://test.com" />);
    const btn = screen.getByText('Add').closest('button');
    expect(btn).not.toBeDisabled();
  });

  it('shows spinner when adding', () => {
    const { container } = render(<ConnectorAddForm {...defaultProps} adding={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls onKeyDown on keydown in input', () => {
    const onKeyDown = vi.fn();
    render(<ConnectorAddForm {...defaultProps} onKeyDown={onKeyDown} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onKeyDown).toHaveBeenCalled();
  });
});
