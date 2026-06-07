import { describe, expect, it } from 'vitest';
import { estimateElementTokens, estimateTokens } from './tokens';

describe('token estimation', () => {
  describe('estimateElementTokens', () => {
    it('should estimate basic element at ~15 tokens', () => {
      const tokens = estimateElementTokens({
        role: 'button',
        name: 'Submit',
        ref: 'e1',
      });

      expect(tokens).toBeGreaterThanOrEqual(10);
      expect(tokens).toBeLessThanOrEqual(20);
    });

    it('should cap long names at 50 token contribution', () => {
      const shortName = estimateElementTokens({
        role: 'button',
        name: 'OK',
        ref: 'e1',
      });
      const longName = estimateElementTokens({
        role: 'button',
        name: 'A'.repeat(1000),
        ref: 'e2',
      });

      expect(longName - shortName).toBeLessThanOrEqual(50);
    });

    it('should add tokens for extra attributes', () => {
      const basic = estimateElementTokens({
        role: 'checkbox',
        name: 'Accept',
        ref: 'e1',
      });
      const withAttrs = estimateElementTokens({
        role: 'checkbox',
        name: 'Accept',
        ref: 'e1',
        checked: true,
        disabled: true,
      });
      expect(withAttrs).toBeGreaterThan(basic);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate YAML string tokens', () => {
      const yaml = `- button "Submit" [ref=e1]
- textbox "Email" [ref=e2]
- link "Home" [ref=e3]`;
      const tokens = estimateTokens(yaml);

      expect(tokens).toBeGreaterThanOrEqual(30);
      expect(tokens).toBeLessThanOrEqual(60);
    });

    it('should handle empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });
  });
});
