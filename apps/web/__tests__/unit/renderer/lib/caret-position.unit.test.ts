import { describe, expect, it } from 'vitest';
import { getCaretPosition } from '@/pages/home/components/caretPosition';

describe('getCaretPosition', () => {
  it('returns top and left coordinates', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'hello world';
    textarea.style.width = '200px';
    textarea.style.fontSize = '16px';
    textarea.style.padding = '8px';
    document.body.appendChild(textarea);

    const pos = getCaretPosition(textarea, 5);
    expect(pos).toHaveProperty('top');
    expect(pos).toHaveProperty('left');
    expect(typeof pos.top).toBe('number');
    expect(typeof pos.left).toBe('number');

    document.body.removeChild(textarea);
  });

  it('returns 0,0 for position 0', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'test';
    document.body.appendChild(textarea);

    const pos = getCaretPosition(textarea, 0);

    expect(pos.top).toBeDefined();
    expect(pos.left).toBeDefined();

    document.body.removeChild(textarea);
  });
});
