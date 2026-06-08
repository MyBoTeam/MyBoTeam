import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { sendPollToolHandler } from './send-poll.js';

describe('SendWhatsAppPoll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates recipient is required', async () => {
    const result = await sendPollToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('recipient'));
  });

  it('validates question is required', async () => {
    const result = await sendPollToolHandler({ recipient: '+1' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('question'));
  });

  it('validates options is a non-empty array', async () => {
    const result = await sendPollToolHandler({
      recipient: '+1',
      question: 'Test?',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('options'));
  });

  it('calls API on valid input', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true, messageId: 'poll-1' });
    const result = await sendPollToolHandler({
      recipient: '+15551234567',
      question: 'Best?',
      options: ['A', 'B'],
    });
    expect(callApi).toHaveBeenCalledWith('/send-poll', {
      recipient: '+15551234567',
      question: 'Best?',
      options: ['A', 'B'],
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('sent'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: false,
      error: 'poll failed',
    });
    const result = await sendPollToolHandler({
      recipient: '+1',
      question: 'Q?',
      options: ['X'],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('poll failed'));
  });
});
