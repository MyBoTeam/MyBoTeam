import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToolSupportBadge } from '@/components/settings/shared/ToolSupportBadge';

describe('ToolSupportBadge', () => {
  const t = vi.fn((key: string) => {
    const map: Record<string, string> = {
      'toolBadge.supported': 'Tools',
      'toolBadge.unsupported': 'No Tools',
      'toolBadge.unknown': 'Unknown',
    };
    return map[key] || key;
  });

  it('renders supported badge', () => {
    render(<ToolSupportBadge status="supported" t={t} />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('renders unsupported badge', () => {
    render(<ToolSupportBadge status="unsupported" t={t} />);
    expect(screen.getByText('No Tools')).toBeInTheDocument();
  });

  it('renders unknown badge', () => {
    render(<ToolSupportBadge status="unknown" t={t} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
