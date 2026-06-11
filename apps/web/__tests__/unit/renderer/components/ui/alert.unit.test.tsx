import { Alert, AlertDescription, AlertTitle } from '@myboteam/ui';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Alert', () => {
  it('renders with role="alert"', () => {
    render(<Alert>content</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Alert>hello</Alert>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Alert>info</Alert>);
    expect(screen.getByRole('alert').className).toContain('bg-background');
  });

  it('applies destructive variant classes', () => {
    render(<Alert variant="destructive">error</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('destructive');
  });

  it('applies custom className', () => {
    render(<Alert className="custom">x</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('custom');
  });
});

describe('AlertTitle', () => {
  it('renders as h5 element', () => {
    render(<AlertTitle>Warning</AlertTitle>);
    const title = screen.getByText('Warning');
    expect(title.tagName).toBe('H5');
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom">Title</AlertTitle>);
    expect(screen.getByText('Title')).toHaveClass('custom');
  });
});

describe('AlertDescription', () => {
  it('renders children', () => {
    render(<AlertDescription>Details here</AlertDescription>);
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AlertDescription className="custom">desc</AlertDescription>);
    expect(screen.getByText('desc')).toHaveClass('custom');
  });
});

describe('Alert composition', () => {
  it('renders Alert with AlertTitle and AlertDescription', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
