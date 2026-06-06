import { describe, expect, it } from 'vitest';
import { getAttachmentIcon } from '@/lib/attachments';

describe('getAttachmentIcon', () => {
  it('returns FileCode icon for code type', () => {
    const icon = getAttachmentIcon('code');
    expect(icon).toBeDefined();
  });

  it('returns Image icon for image type', () => {
    const icon = getAttachmentIcon('image');
    expect(icon).toBeDefined();
  });

  it('returns FileText icon for text type', () => {
    const icon = getAttachmentIcon('text');
    expect(icon).toBeDefined();
  });

  it('returns FilePdf icon for pdf type', () => {
    const icon = getAttachmentIcon('pdf');
    expect(icon).toBeDefined();
  });

  it('returns File icon for unknown types', () => {
    const icon = getAttachmentIcon('unknown');
    expect(icon).toBeDefined();
  });
});
