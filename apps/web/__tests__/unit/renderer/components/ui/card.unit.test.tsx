import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function renderComponent(ui: React.ReactElement) {
  const { container } = render(ui);
  return container.firstChild;
}

describe('Card', () => {
  it('renders', () => {
    const el = renderComponent(<Card>content</Card>);
    expect(el).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Card>hello</Card>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom">x</Card>);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('CardHeader', () => {
  it('renders', () => {
    const el = renderComponent(<CardHeader>header</CardHeader>);
    expect(el).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders', () => {
    const el = renderComponent(<CardTitle>title</CardTitle>);
    expect(el).toBeInTheDocument();
  });
});

describe('CardDescription', () => {
  it('renders', () => {
    const el = renderComponent(<CardDescription>desc</CardDescription>);
    expect(el).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders', () => {
    const el = renderComponent(<CardContent>cnt</CardContent>);
    expect(el).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders', () => {
    const el = renderComponent(<CardFooter>footer</CardFooter>);
    expect(el).toBeInTheDocument();
  });
});
