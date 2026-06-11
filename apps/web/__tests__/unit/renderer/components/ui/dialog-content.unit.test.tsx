import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@myboteam/ui';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DialogContent', () => {
  it('renders dialog content when open', () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <div>Content body</div>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Content body')).toBeInTheDocument();
  });
});
