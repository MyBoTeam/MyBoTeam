import { describe, expect, it } from 'vitest';
import { mapPiBrowserFrameEvent } from '../../src/events/pi-browser-frame-mapper.js';

describe('Pi browser frame mapping', () => {
  it('preserves current browser frame payload shape', () => {
    expect(
      mapPiBrowserFrameEvent(
        {
          frame: 'data:image/png;base64,abc',
          pageName: 'Preview',
          timestamp: 1_700_000_000_000,
          taskId: 'task-1',
        },
        { pageName: 'Default' },
      ),
    ).toEqual({
      frame: 'data:image/png;base64,abc',
      pageName: 'Preview',
      timestamp: 1_700_000_000_000,
      taskId: 'task-1',
    });
  });

  it('fills stable defaults when Pi omits optional frame metadata', () => {
    expect(
      mapPiBrowserFrameEvent(
        { frame: 'data:image/png;base64,abc' },
        {
          pageName: 'Browser',
          taskId: 'task-2',
          timestamp: 1_700_000_000_001,
        },
      ),
    ).toEqual({
      frame: 'data:image/png;base64,abc',
      pageName: 'Browser',
      timestamp: 1_700_000_000_001,
      taskId: 'task-2',
    });
  });
});
