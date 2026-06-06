/**
 * Unit tests for Animation library
 *
 * Tests the animation configuration objects:
 * - Spring configurations have expected values
 * - Variants have correct initial/animate/exit states
 * - Interaction presets (hover/tap) have correct scale values
 */

import { describe, expect, it } from 'vitest';
import {
  buttonPress,
  cardHover,
  settingsTransitions,
  settingsVariants,
  springs,
  staggerContainer,
  staggerItem,
  variants,
} from '@/lib/animations';

describe('Animation Library', () => {
  describe('Spring Configurations', () => {
    it('should have correct bouncy spring values', () => {
      expect(springs.bouncy).toEqual({
        type: 'spring',
        stiffness: 400,
        damping: 25,
      });
    });

    it('should have correct gentle spring values', () => {
      expect(springs.gentle).toEqual({
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    });

    it('should have correct snappy spring values', () => {
      expect(springs.snappy).toEqual({
        type: 'spring',
        stiffness: 500,
        damping: 30,
      });
    });

    it('should have valid ranges for all springs', () => {
      Object.values(springs).forEach((spring) => {
        expect(spring.stiffness).toBeGreaterThanOrEqual(100);
        expect(spring.stiffness).toBeLessThanOrEqual(1000);
        expect(spring.damping).toBeGreaterThanOrEqual(10);
        expect(spring.damping).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Animation Variants', () => {
    it('should have correct fadeUp values', () => {
      expect(variants.fadeUp.initial).toEqual({ opacity: 0, y: 12 });
      expect(variants.fadeUp.animate).toEqual({ opacity: 1, y: 0 });
      expect(variants.fadeUp.exit).toEqual({ opacity: 0, y: -8 });
    });

    it('should have correct fadeIn values', () => {
      expect(variants.fadeIn.initial).toEqual({ opacity: 0 });
      expect(variants.fadeIn.animate).toEqual({ opacity: 1 });
      expect(variants.fadeIn.exit).toEqual({ opacity: 0 });
    });

    it('should have correct scaleIn values', () => {
      expect(variants.scaleIn.initial).toEqual({ opacity: 0, scale: 0.95 });
      expect(variants.scaleIn.animate).toEqual({ opacity: 1, scale: 1 });
      expect(variants.scaleIn.exit).toEqual({ opacity: 0, scale: 0.95 });
    });

    it('should have correct slideInRight values', () => {
      expect(variants.slideInRight.initial).toEqual({ opacity: 0, x: 20 });
      expect(variants.slideInRight.animate).toEqual({ opacity: 1, x: 0 });
      expect(variants.slideInRight.exit).toEqual({ opacity: 0, x: -20 });
    });

    it('should have correct slideInLeft values', () => {
      expect(variants.slideInLeft.initial).toEqual({ opacity: 0, x: -12 });
      expect(variants.slideInLeft.animate).toEqual({ opacity: 1, x: 0 });
      expect(variants.slideInLeft.exit).toEqual({ opacity: 0, x: -12 });
    });

    it('should all start with opacity 0 and animate to opacity 1', () => {
      Object.values(variants).forEach((variant) => {
        expect((variant.initial as { opacity: number }).opacity).toBe(0);
        expect((variant.animate as { opacity: number }).opacity).toBe(1);
        expect((variant.exit as { opacity: number }).opacity).toBe(0);
      });
    });
  });

  describe('Stagger Animations', () => {
    it('should have correct stagger container configuration', () => {
      expect(staggerContainer.initial).toEqual({});
      expect(staggerContainer.animate).toEqual({
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1,
        },
      });
    });

    it('should have correct stagger item configuration', () => {
      expect(staggerItem.initial).toEqual({ opacity: 0, y: 8 });
      expect(staggerItem.animate).toEqual({ opacity: 1, y: 0 });
    });
  });

  describe('Interaction Presets', () => {
    it('should have correct cardHover scale values', () => {
      expect(cardHover.rest).toEqual({ scale: 1 });
      expect(cardHover.hover).toEqual({ scale: 1.02 });
      expect(cardHover.tap).toEqual({ scale: 0.98 });
    });

    it('should have correct buttonPress scale values', () => {
      expect(buttonPress.rest).toEqual({ scale: 1 });
      expect(buttonPress.hover).toEqual({ scale: 1.02 });
      expect(buttonPress.tap).toEqual({ scale: 0.95 });
    });

    it('should have button tap more pronounced than card tap', () => {
      expect(buttonPress.tap.scale).toBeLessThan(cardHover.tap.scale);
    });
  });

  describe('Settings Variants', () => {
    it('should have correct slideDown values', () => {
      expect(settingsVariants.slideDown.initial).toEqual({ opacity: 0, y: -12 });
      expect(settingsVariants.slideDown.animate).toEqual({ opacity: 1, y: 0 });
      expect(settingsVariants.slideDown.exit).toEqual({ opacity: 0, y: -8 });
    });

    it('should have correct fadeSlide values', () => {
      expect(settingsVariants.fadeSlide.initial).toEqual({ opacity: 0, y: -8 });
      expect(settingsVariants.fadeSlide.animate).toEqual({ opacity: 1, y: 0 });
      expect(settingsVariants.fadeSlide.exit).toEqual({ opacity: 0, y: -4 });
    });

    it('should have correct scaleDropdown values', () => {
      expect(settingsVariants.scaleDropdown.initial).toEqual({ opacity: 0, scale: 0.95 });
      expect(settingsVariants.scaleDropdown.animate).toEqual({ opacity: 1, scale: 1 });
      expect(settingsVariants.scaleDropdown.exit).toEqual({ opacity: 0, scale: 0.95 });
    });

    it('should have correct gridStagger values', () => {
      expect(settingsVariants.gridStagger.initial).toEqual({ opacity: 0, y: 8 });
      expect(settingsVariants.gridStagger.animate).toEqual({ opacity: 1, y: 0 });
      expect(settingsVariants.gridStagger.exit).toEqual({ opacity: 0 });
    });
  });

  describe('Settings Transitions', () => {
    it('should have correct enter duration', () => {
      expect(settingsTransitions.enter).toEqual({ duration: 0.2 });
    });

    it('should have correct exit duration', () => {
      expect(settingsTransitions.exit).toEqual({ duration: 0.15 });
    });

    it('should have correct fast duration', () => {
      expect(settingsTransitions.fast).toEqual({ duration: 0.1 });
    });

    it('stagger should return correct delay based on index', () => {
      expect(settingsTransitions.stagger(0)).toEqual({ duration: 0.2, delay: 0 });
      expect(settingsTransitions.stagger(1)).toEqual({ duration: 0.2, delay: 0.04 });
      expect(settingsTransitions.stagger(5)).toEqual({ duration: 0.2, delay: 0.2 });
    });
  });

  describe('Export Structure', () => {
    it('should export all required animations', () => {
      expect(Object.keys(springs)).toEqual(['bouncy', 'gentle', 'snappy']);
      expect(Object.keys(variants)).toEqual([
        'fadeUp',
        'fadeIn',
        'scaleIn',
        'slideInRight',
        'slideInLeft',
      ]);
      expect(staggerContainer).toBeDefined();
      expect(staggerItem).toBeDefined();
      expect(cardHover).toBeDefined();
      expect(buttonPress).toBeDefined();
    });
  });
});
