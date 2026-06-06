import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiKeyInput } from '@/components/settings/shared/ApiKeyInput';

describe('ApiKeyInput', () => {
  it('renders default label', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} />);
    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  it('renders default placeholder', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Enter API Key')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('renders help link when helpUrl provided', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} helpUrl="https://example.com" />);
    expect(screen.getByText('How can I find it?')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const onChange = vi.fn();
    render(<ApiKeyInput value="" onChange={onChange} />);
    const input = screen.getByTestId('api-key-input');
    fireEvent.change(input, { target: { value: 'new-key' } });
    expect(onChange).toHaveBeenCalledWith('new-key');
  });

  it('shows clear button when value is not empty', () => {
    const onChange = vi.fn();
    render(<ApiKeyInput value="some-key" onChange={onChange} />);
    const clearBtn = screen.getByRole('button');
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not show clear button when value is empty', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} disabled={true} />);
    expect(screen.getByTestId('api-key-input')).toBeDisabled();
  });

  it('shows error message', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} error="Invalid key" />);
    expect(screen.getByText('Invalid key')).toBeInTheDocument();
  });
});
