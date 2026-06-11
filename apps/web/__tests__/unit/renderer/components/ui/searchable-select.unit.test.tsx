import { SearchableSelect } from '@/components/searchable-select';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const items = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Banana' },
  { id: '3', name: 'Cherry' },
];

describe('SearchableSelect', () => {
  it('renders label and placeholder', () => {
    render(<SearchableSelect items={items} value={null} onChange={() => {}} label="Fruit" />);
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders selected item name when value matches', () => {
    render(<SearchableSelect items={items} value="2" onChange={() => {}} label="Fruit" />);
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('renders loading state when loading prop is true', () => {
    render(
      <SearchableSelect items={items} value={null} onChange={() => {}} label="Fruit" loading />,
    );
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('Loading fruit...')).toBeInTheDocument();
  });

  it('renders loading state with custom message', () => {
    render(
      <SearchableSelect
        items={items}
        value={null}
        onChange={() => {}}
        label="Fruit"
        loading
        loadingMessage="Fetching..."
      />,
    );
    expect(screen.getByText('Fetching...')).toBeInTheDocument();
  });

  it('renders error message when error and errorMessage are set', () => {
    render(
      <SearchableSelect
        items={items}
        value={null}
        onChange={() => {}}
        label="Fruit"
        error
        errorMessage="This field is required"
      />,
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
