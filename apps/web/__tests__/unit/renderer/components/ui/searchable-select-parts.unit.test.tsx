import {
  ChevronIcon,
  SelectDropdown,
  SelectError,
  SelectLoading,
  SelectOption,
  SelectTrigger,
} from '@/components/searchable-select-parts';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ChevronIcon', () => {
  it('renders without rotation when closed', () => {
    const { container } = render(<ChevronIcon isOpen={false} />);
    expect(container.querySelector('svg')).not.toHaveClass('rotate-180');
  });

  it('renders with rotation when open', () => {
    const { container } = render(<ChevronIcon isOpen={true} />);
    expect(container.querySelector('svg')).toHaveClass('rotate-180');
  });
});

describe('SelectTrigger', () => {
  it('renders display value when provided', () => {
    render(
      <SelectTrigger
        displayValue="Option A"
        placeholder="Select..."
        isOpen={false}
        onClick={() => {}}
        listboxId="list-1"
      />,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('renders placeholder when no display value', () => {
    render(
      <SelectTrigger
        displayValue=""
        placeholder="Pick one"
        isOpen={false}
        onClick={() => {}}
        listboxId="list-1"
      />,
    );
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('shows error styling when error is true', () => {
    const { container } = render(
      <SelectTrigger
        displayValue=""
        placeholder="x"
        isOpen={false}
        error={true}
        onClick={() => {}}
        listboxId="list-1"
      />,
    );
    expect(container.querySelector('button')).toHaveClass('border-destructive');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <SelectTrigger
        displayValue=""
        placeholder="x"
        isOpen={false}
        onClick={onClick}
        listboxId="list-1"
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('sets aria-expanded based on isOpen', () => {
    render(
      <SelectTrigger
        displayValue=""
        placeholder="x"
        isOpen={true}
        onClick={() => {}}
        listboxId="list-1"
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('SelectOption', () => {
  it('renders item name', () => {
    render(
      <SelectOption item={{ id: '1', name: 'Alpha' }} isSelected={false} onSelect={() => {}} />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('shows selected styling when selected', () => {
    const { container } = render(
      <SelectOption item={{ id: '1', name: 'Alpha' }} isSelected={true} onSelect={() => {}} />,
    );
    expect(container.querySelector('button')).toHaveClass('bg-muted');
  });

  it('calls onSelect with item id', () => {
    const onSelect = vi.fn();
    render(
      <SelectOption item={{ id: '42', name: 'Item' }} isSelected={false} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText('Item'));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe('SelectDropdown', () => {
  const items = [
    { id: '1', name: 'One' },
    { id: '2', name: 'Two' },
  ];

  it('renders items', () => {
    render(
      <SelectDropdown
        items={items}
        value={null}
        showSearch={false}
        search=""
        onSearchChange={() => {}}
        searchPlaceholder="Search..."
        emptyMessage="No results"
        onSelect={() => {}}
        inputRef={{ current: null }}
        listboxId="list-1"
      />,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('shows empty message when no items', () => {
    render(
      <SelectDropdown
        items={[]}
        value={null}
        showSearch={false}
        search=""
        onSearchChange={() => {}}
        searchPlaceholder="Search..."
        emptyMessage="Nothing here"
        onSelect={() => {}}
        inputRef={{ current: null }}
        listboxId="list-1"
      />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows search input when showSearch is true', () => {
    render(
      <SelectDropdown
        items={items}
        value={null}
        showSearch={true}
        search=""
        onSearchChange={() => {}}
        searchPlaceholder="Type to filter..."
        emptyMessage="No results"
        onSelect={() => {}}
        inputRef={{ current: null }}
        listboxId="list-1"
      />,
    );
    expect(screen.getByPlaceholderText('Type to filter...')).toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', () => {
    const onSearchChange = vi.fn();
    render(
      <SelectDropdown
        items={items}
        value={null}
        showSearch={true}
        search=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Search..."
        emptyMessage="No results"
        onSelect={() => {}}
        inputRef={{ current: null }}
        listboxId="list-1"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'test' } });
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });
});

describe('SelectError', () => {
  it('renders error message', () => {
    render(<SelectError message="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});

describe('SelectLoading', () => {
  it('renders loading state with message', () => {
    render(<SelectLoading label="Models" loadingMessage="Fetching..." />);
    expect(screen.getByText('Fetching...')).toBeInTheDocument();
  });

  it('renders loading state with default message', () => {
    render(<SelectLoading label="Models" />);
    expect(screen.getByText('Loading models...')).toBeInTheDocument();
  });
});
