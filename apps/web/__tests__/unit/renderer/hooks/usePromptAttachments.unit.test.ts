import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'plusMenu.fileTooLarge') {
        return `File ${options?.name} exceeds ${options?.limit}`;
      }
      if (key === 'plusMenu.tooManyFiles') {
        return `Max ${options?.max} files`;
      }
      return key;
    },
  }),
}));

const mockProcessFileAttachments = vi.hoisted(() => vi.fn());
vi.mock('@/config/fileUtils', () => ({
  processFileAttachments: mockProcessFileAttachments,
  MAX_FILES: 10,
}));

import { usePromptAttachments } from '@/pages/home/hooks/usePromptAttachments';

describe('buildPromptWithAttachments', () => {
  it('returns prompt unchanged when no files', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    expect(result.current.buildPromptWithAttachments('Hello', [])).toBe('Hello');
  });

  it('appends file references for text files', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    const output = result.current.buildPromptWithAttachments('Do this', [
      { path: '/path/to/file.txt', type: 'file' as const },
    ]);
    expect(output).toContain('[Attached file: /path/to/file.txt]');
  });

  it('appends image references for image files', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    const output = result.current.buildPromptWithAttachments('Look at', [
      { path: '/img/photo.png', type: 'image' as const },
    ]);
    expect(output).toContain('[Attached image: /img/photo.png]');
  });

  it('handles multiple files', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    const output = result.current.buildPromptWithAttachments('Check', [
      { path: 'a.txt', type: 'file' as const },
      { path: 'b.png', type: 'image' as const },
    ]);
    expect(output).toContain('[Attached file: a.txt]');
    expect(output).toContain('[Attached image: b.png]');
  });
});

describe('handleExampleClick', () => {
  it('calls setPrompt with the example prompt', () => {
    const setPrompt = vi.fn();
    const { result } = renderHook(() => usePromptAttachments({ setPrompt }));
    act(() => {
      result.current.handleExampleClick('Write a poem');
    });
    expect(setPrompt).toHaveBeenCalledWith('Write a poem');
  });
});

describe('handleSkillSelect', () => {
  it('prepends command to current prompt', () => {
    let currentPrompt = 'hello world';
    const setPrompt = vi.fn((updater) => {
      if (typeof updater === 'function') {
        currentPrompt = updater(currentPrompt);
      }
    });
    const { result } = renderHook(() => usePromptAttachments({ setPrompt }));
    act(() => {
      result.current.handleSkillSelect('/write');
    });
    expect(currentPrompt).toBe('/write hello world');
  });
});

describe('MAX_FILES', () => {
  it('exports MAX_FILES constant', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    expect(result.current.MAX_FILES).toBe(10);
  });
});

describe('addFiles', () => {
  beforeEach(() => {
    mockProcessFileAttachments.mockReturnValue([]);
  });

  it('calls processFileAttachments with files', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    act(() => {
      result.current.addFiles([]);
    });
    expect(mockProcessFileAttachments).toHaveBeenCalled();
  });

  it('adds accepted files to attachments', () => {
    const acceptedFile = { path: '/test.txt', type: 'file' as const };
    mockProcessFileAttachments.mockReturnValue([acceptedFile]);

    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    act(() => {
      result.current.addFiles([]);
    });
    expect(result.current.attachments).toContainEqual(acceptedFile);
  });

  it('clears previous attachment error', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    act(() => {
      result.current.addFiles([]);
    });
    expect(result.current.attachmentError).toBeNull();
  });
});

describe('handleAttachFiles', () => {
  it('creates a file input and triggers click', () => {
    const { result } = renderHook(() => usePromptAttachments({ setPrompt: vi.fn() }));
    const createElementSpy = vi.spyOn(document, 'createElement');
    act(() => {
      result.current.handleAttachFiles();
    });
    expect(createElementSpy).toHaveBeenCalledWith('input');
    createElementSpy.mockRestore();
  });
});
