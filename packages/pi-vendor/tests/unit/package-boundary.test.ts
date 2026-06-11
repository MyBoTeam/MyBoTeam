import { describe, expect, it } from 'vitest';
import {
  PI_UPSTREAM_COMMIT_SHA,
  PI_UPSTREAM_RELEASE_TAG,
  piAgentCore,
  piAi,
} from '../../src/index.js';

describe('@myboteam/pi-vendor package boundary', () => {
  it('exports the pinned upstream Pi namespaces from a separate package', () => {
    expect(PI_UPSTREAM_RELEASE_TAG).toBe('v0.79.1');
    expect(PI_UPSTREAM_COMMIT_SHA).toBe('28df940f0d07b65284849a483be7b06e2ca046ee');
    expect(piAgentCore).toHaveProperty('runAgentLoop');
    expect(piAi).toHaveProperty('stream');
    expect(piAi).toHaveProperty('complete');
  });
});
