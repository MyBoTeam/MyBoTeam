import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../components/code-block';
import { TooltipProvider } from '../components/ui/tooltip';

function renderWithTooltip(element: React.ReactElement) {
  return render(<TooltipProvider>{element}</TooltipProvider>);
}

describe('CodeBlock', () => {
  const sampleCode = `const greeting = "Hello, World!";
console.log(greeting);`;

  it('renders with code content', () => {
    renderWithTooltip(<CodeBlock language="javascript">{sampleCode}</CodeBlock>);
    expect(screen.getByText(/Hello, World!/)).toBeInTheDocument();
    expect(screen.getByText(/console/)).toBeInTheDocument();
  });

  it('renders with copy button', () => {
    renderWithTooltip(<CodeBlock language="javascript">{sampleCode}</CodeBlock>);
    const copyButton = screen.getByTestId('code-block-copy-button');
    expect(copyButton).toBeInTheDocument();
  });

  it('renders with language label', () => {
    renderWithTooltip(<CodeBlock language="javascript">{sampleCode}</CodeBlock>);
    expect(screen.getByText(/javascript/i)).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    renderWithTooltip(<CodeBlock inline>{'inline code'}</CodeBlock>);
    expect(screen.getByText(/inline code/)).toBeInTheDocument();
  });
});
