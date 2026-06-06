import { describe, expect, it } from 'vitest';
import { isWaitingForUser } from '../../../../src/common/utils/waiting-detection.js';

describe('isWaitingForUser', () => {
  describe('returns true for waiting patterns', () => {
    it('detects "let me know when"', () => {
      expect(isWaitingForUser('Let me know when you are done.')).toBe(true);
    });

    it('detects "let me know once"', () => {
      expect(isWaitingForUser('Let me know once you have the results.')).toBe(true);
    });

    it('detects "let me know after"', () => {
      expect(isWaitingForUser('let me know after you check')).toBe(true);
    });

    it('detects "tell me when"', () => {
      expect(isWaitingForUser('Tell me when you finish.')).toBe(true);
    });

    it('detects "waiting for you"', () => {
      expect(isWaitingForUser('Waiting for you to confirm.')).toBe(true);
    });

    it('detects "once you have"', () => {
      expect(isWaitingForUser('Once you have the file, I can proceed.')).toBe(true);
    });

    it('detects "please log in"', () => {
      expect(isWaitingForUser('Please log in to continue.')).toBe(true);
    });

    it('detects "enter your credentials"', () => {
      expect(isWaitingForUser('Enter your credentials to continue.')).toBe(true);
    });

    it('detects "manual intervention"', () => {
      expect(isWaitingForUser('This requires manual intervention.')).toBe(true);
    });

    it('detects "I need you to"', () => {
      expect(isWaitingForUser('I need you to click the button.')).toBe(true);
    });

    it('detects "click Continue when"', () => {
      expect(isWaitingForUser('Click "Continue" when you are ready.')).toBe(true);
    });

    it('detects "standing by"', () => {
      expect(isWaitingForUser('Standing by for your input.')).toBe(true);
    });
  });

  describe('returns false for non-waiting patterns', () => {
    it('returns false for empty string', () => {
      expect(isWaitingForUser('')).toBe(false);
    });

    it('returns false for normal responses', () => {
      expect(isWaitingForUser('I have completed the task.')).toBe(false);
    });

    it('returns false for informational messages', () => {
      expect(isWaitingForUser('The file has been created at /tmp/test.txt')).toBe(false);
    });

    it('returns false for simple confirmations', () => {
      expect(isWaitingForUser('Done! I have updated all the files.')).toBe(false);
    });
  });
});
