import { describe, expect, it } from 'vitest';
import { getGlassCSSVars, getGlassStyles } from '@/lib/glass-utils';

describe('glass-utils', () => {
  describe('getGlassStyles()', () => {
    it('returns empty object when no customization', () => {
      expect(getGlassStyles()).toEqual({});
      expect(getGlassStyles(undefined)).toEqual({});
    });

    it('returns empty object when customization is empty', () => {
      expect(getGlassStyles({})).toEqual({});
    });

    it('handles color only', () => {
      const result = getGlassStyles({ color: '#ff0000' });
      expect(result.backgroundColor).toBe('#ff0000');
    });

    it('handles transparency with rgba color', () => {
      const result = getGlassStyles({ color: 'rgba(255, 0, 0, 0.5)', transparency: 0.8 });
      expect(result.backgroundColor).toBe('rgba(255, 0, 0, 0.8)');
    });

    it('handles transparency with hex color', () => {
      const result = getGlassStyles({ color: '#ff0000', transparency: 0.5 });
      expect(result.backgroundColor).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('handles transparency with named color', () => {
      const result = getGlassStyles({ color: 'red', transparency: 0.3 });
      expect(result.backgroundColor).toBe('red0.3');
    });

    it('handles transparency without explicit color', () => {
      const result = getGlassStyles({ transparency: 0.4 });
      expect(result.backgroundColor).toBe('rgba(255, 255, 255, 0.4)');
    });

    it('handles blur as number', () => {
      const result = getGlassStyles({ blur: 10 });
      expect(result.backdropFilter).toBe('blur(10px)');
      expect(result.WebkitBackdropFilter).toBe('blur(10px)');
    });

    it('handles blur as string', () => {
      const result = getGlassStyles({ blur: '20px' });
      expect(result.backdropFilter).toBe('blur(20px)');
    });

    it('handles outline', () => {
      const result = getGlassStyles({ outline: '#fff', outlineWidth: 2 });
      expect(result.borderColor).toBe('#fff');
      expect(result.borderWidth).toBe('2px');
      expect(result.borderStyle).toBe('solid');
    });

    it('handles outline as string width', () => {
      const result = getGlassStyles({ outline: '#000', outlineWidth: '3px' });
      expect(result.borderWidth).toBe('3px');
    });

    it('adds default border when color/blur/transparency is set without outline', () => {
      const result = getGlassStyles({ color: '#fff' });
      expect(result.borderColor).toBe('rgba(255, 255, 255, 0.3)');
      expect(result.borderWidth).toBe('1px');
      expect(result.borderStyle).toBe('solid');
    });

    it('does not add default border when outline is explicitly set', () => {
      const result = getGlassStyles({ outline: 'red', color: '#fff' });
      expect(result.borderColor).toBe('red');
    });

    it('handles custom shadow', () => {
      const result = getGlassStyles({ shadow: '0 0 10px rgba(0,0,0,0.5)' });
      expect(result.boxShadow).toBe('0 0 10px rgba(0,0,0,0.5)');
    });

    it('adds default shadow when color/blur/transparency is set without shadow', () => {
      const result = getGlassStyles({ color: '#fff' });
      expect(result.boxShadow).toBe('0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)');
    });

    it('handles innerGlow', () => {
      const result = getGlassStyles({ innerGlow: 'rgba(255,255,255,0.3)' });
      expect(result.boxShadow).toBe('inset 0 0 20px rgba(255,255,255,0.3)');
    });

    it('handles innerGlow with custom blur as number', () => {
      const result = getGlassStyles({ innerGlow: 'rgba(0,0,0,0.5)', innerGlowBlur: 10 });
      expect(result.boxShadow).toBe('inset 0 0 10px rgba(0,0,0,0.5)');
    });

    it('handles innerGlow with custom blur as string', () => {
      const result = getGlassStyles({
        innerGlow: 'rgba(0,0,0,0.5)',
        innerGlowBlur: '15px',
      });
      expect(result.boxShadow).toBe('inset 0 0 15px rgba(0,0,0,0.5)');
    });

    it('combines shadow and innerGlow', () => {
      const result = getGlassStyles({
        shadow: '0 0 10px black',
        innerGlow: 'rgba(255,255,255,0.2)',
      });
      expect(result.boxShadow).toBe('0 0 10px black, inset 0 0 20px rgba(255,255,255,0.2)');
    });

    it('no shadow when color/blur/transparency and shadow are unset', () => {
      const result = getGlassStyles({ outline: '#fff' });
      expect(result.boxShadow).toBeUndefined();
    });
  });

  describe('getGlassCSSVars()', () => {
    it('returns empty object when no customization', () => {
      expect(getGlassCSSVars()).toEqual({});
      expect(getGlassCSSVars(undefined)).toEqual({});
    });

    it('sets --glass-bg-custom for color', () => {
      const result = getGlassCSSVars({ color: '#ff0000' });
      expect(result['--glass-bg-custom']).toBe('#ff0000');
    });

    it('handles transparency with rgba in CSS vars', () => {
      const result = getGlassCSSVars({ color: 'rgba(255,0,0,0.5)', transparency: 0.3 });
      expect(result['--glass-bg-custom']).toBe('rgba(255, 0, 0, 0.3)');
    });

    it('handles transparency with hex in CSS vars', () => {
      const result = getGlassCSSVars({ color: '#00ff00', transparency: 0.7 });
      expect(result['--glass-bg-custom']).toBe('rgba(0, 255, 0, 0.7)');
    });

    it('sets --glass-bg-custom for transparency without color', () => {
      const result = getGlassCSSVars({ transparency: 0.4 });
      expect(result['--glass-bg-custom']).toBe('rgba(255, 255, 255, 0.4)');
    });

    it('handles transparency with named color in CSS vars', () => {
      const result = getGlassCSSVars({ color: 'red', transparency: 0.3 });
      expect(result['--glass-bg-custom']).toBe('red');
    });

    it('sets --blur-custom', () => {
      const result = getGlassCSSVars({ blur: 15 });
      expect(result['--blur-custom']).toBe('15px');
    });

    it('sets --blur-custom as string', () => {
      const result = getGlassCSSVars({ blur: '30px' });
      expect(result['--blur-custom']).toBe('30px');
    });

    it('sets --glass-border-custom', () => {
      const result = getGlassCSSVars({ outline: 'blue' });
      expect(result['--glass-border-custom']).toBe('blue');
    });

    it('sets --glass-border-width-custom as number', () => {
      const result = getGlassCSSVars({ outlineWidth: 3 });
      expect(result['--glass-border-width-custom']).toBe('3px');
    });

    it('sets --glass-border-width-custom as string', () => {
      const result = getGlassCSSVars({ outlineWidth: '4px' });
      expect(result['--glass-border-width-custom']).toBe('4px');
    });

    it('sets --glass-shadow-custom', () => {
      const result = getGlassCSSVars({ shadow: '0 5px 15px rgba(0,0,0,0.3)' });
      expect(result['--glass-shadow-custom']).toBe('0 5px 15px rgba(0,0,0,0.3)');
    });

    it('sets --glass-inner-glow-custom', () => {
      const result = getGlassCSSVars({ innerGlow: 'rgba(255,255,255,0.4)' });
      expect(result['--glass-inner-glow-custom']).toBe('rgba(255,255,255,0.4)');
    });

    it('sets --glass-inner-glow-blur-custom as number', () => {
      const result = getGlassCSSVars({ innerGlowBlur: 25 });
      expect(result['--glass-inner-glow-blur-custom']).toBe('25px');
    });

    it('sets --glass-inner-glow-blur-custom as string', () => {
      const result = getGlassCSSVars({ innerGlowBlur: '30px' });
      expect(result['--glass-inner-glow-blur-custom']).toBe('30px');
    });
  });
});
