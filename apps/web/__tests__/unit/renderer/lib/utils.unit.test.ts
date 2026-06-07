import { describe, expect, it } from 'vitest';
import { cn } from '@/utils/utils';

describe('utils.ts', () => {
  describe('cn() - class name merging', () => {
    describe('basic usage', () => {
      it('should return single class unchanged', () => {
        const result = cn('text-red-500');

        expect(result).toBe('text-red-500');
      });

      it('should merge multiple classes', () => {
        const result = cn('text-red-500', 'bg-white');

        expect(result).toBe('text-red-500 bg-white');
      });

      it('should handle empty string inputs', () => {
        const result = cn('', 'text-red-500', '');

        expect(result).toBe('text-red-500');
      });

      it('should handle no arguments', () => {
        const result = cn();

        expect(result).toBe('');
      });

      it('should handle single empty string', () => {
        const result = cn('');

        expect(result).toBe('');
      });
    });

    describe('conditional classes with clsx', () => {
      it('should include class when condition is true', () => {
        const isActive = true;

        const result = cn('base', isActive && 'active');

        expect(result).toBe('base active');
      });

      it('should exclude class when condition is false', () => {
        const isActive = false;

        const result = cn('base', isActive && 'active');

        expect(result).toBe('base');
      });

      it('should handle object syntax for conditionals', () => {
        const isActive = true;
        const isDisabled = false;

        const result = cn('base', {
          active: isActive,
          disabled: isDisabled,
        });

        expect(result).toBe('base active');
      });

      it('should handle array of classes', () => {
        const result = cn(['text-red-500', 'bg-white']);

        expect(result).toBe('text-red-500 bg-white');
      });

      it('should handle nested arrays', () => {
        const result = cn(['base', ['nested1', 'nested2']]);

        expect(result).toBe('base nested1 nested2');
      });

      it('should handle null and undefined values', () => {
        const result = cn('base', null, undefined, 'end');

        expect(result).toBe('base end');
      });

      it('should handle false and 0 values', () => {
        const result = cn('base', false, 0, 'end');

        expect(result).toBe('base end');
      });
    });

    describe('Tailwind conflict resolution', () => {
      it('should resolve conflicting padding classes (later wins)', () => {
        const result = cn('p-4', 'p-8');

        expect(result).toBe('p-8');
      });

      it('should resolve conflicting margin classes', () => {
        const result = cn('m-2', 'm-4');

        expect(result).toBe('m-4');
      });

      it('should resolve conflicting text color classes', () => {
        const result = cn('text-red-500', 'text-blue-500');

        expect(result).toBe('text-blue-500');
      });

      it('should resolve conflicting background color classes', () => {
        const result = cn('bg-white', 'bg-black');

        expect(result).toBe('bg-black');
      });

      it('should not merge non-conflicting classes', () => {
        const result = cn('text-red-500', 'bg-white', 'p-4');

        expect(result).toBe('text-red-500 bg-white p-4');
      });

      it('should resolve conflicting font size classes', () => {
        const result = cn('text-sm', 'text-lg');

        expect(result).toBe('text-lg');
      });

      it('should resolve conflicting font weight classes', () => {
        const result = cn('font-normal', 'font-bold');

        expect(result).toBe('font-bold');
      });

      it('should resolve conflicting display classes', () => {
        const result = cn('block', 'flex');

        expect(result).toBe('flex');
      });

      it('should resolve conflicting width classes', () => {
        const result = cn('w-full', 'w-1/2');

        expect(result).toBe('w-1/2');
      });

      it('should resolve conflicting height classes', () => {
        const result = cn('h-10', 'h-20');

        expect(result).toBe('h-20');
      });

      it('should handle directional padding without conflict', () => {
        const result = cn('px-4', 'py-2');

        expect(result).toBe('px-4 py-2');
      });

      it('should resolve px vs px conflicts', () => {
        const result = cn('px-4', 'px-8');

        expect(result).toBe('px-8');
      });

      it('should not confuse px with p', () => {
        const result = cn('p-4', 'px-8');

        expect(result).toContain('p-4');
        expect(result).toContain('px-8');
      });

      it('should resolve conflicting rounded classes', () => {
        const result = cn('rounded', 'rounded-lg');

        expect(result).toBe('rounded-lg');
      });

      it('should resolve conflicting border classes', () => {
        const result = cn('border', 'border-2');

        expect(result).toBe('border-2');
      });

      it('should resolve conflicting z-index classes', () => {
        const result = cn('z-10', 'z-50');

        expect(result).toBe('z-50');
      });
    });

    describe('responsive and state variants', () => {
      it('should handle responsive prefixes', () => {
        const result = cn('text-sm', 'md:text-base', 'lg:text-lg');

        expect(result).toBe('text-sm md:text-base lg:text-lg');
      });

      it('should resolve conflicts within same breakpoint', () => {
        const result = cn('md:text-sm', 'md:text-lg');

        expect(result).toBe('md:text-lg');
      });

      it('should handle hover states', () => {
        const result = cn('bg-white', 'hover:bg-gray-100');

        expect(result).toBe('bg-white hover:bg-gray-100');
      });

      it('should resolve hover state conflicts', () => {
        const result = cn('hover:bg-gray-100', 'hover:bg-gray-200');

        expect(result).toBe('hover:bg-gray-200');
      });

      it('should handle focus states', () => {
        const result = cn('outline-none', 'focus:outline-2');

        expect(result).toBe('outline-none focus:outline-2');
      });

      it('should handle dark mode', () => {
        const result = cn('bg-white', 'dark:bg-gray-900');

        expect(result).toBe('bg-white dark:bg-gray-900');
      });
    });

    describe('complex real-world usage', () => {
      it('should handle button variant pattern', () => {
        const baseClasses = 'px-4 py-2 rounded font-medium';
        const variantClasses = 'bg-blue-500 text-white hover:bg-blue-600';
        const sizeOverride = 'px-6 py-3';

        const result = cn(baseClasses, variantClasses, sizeOverride);

        expect(result).toContain('px-6');
        expect(result).toContain('py-3');
        expect(result).toContain('rounded');
        expect(result).toContain('font-medium');
        expect(result).toContain('bg-blue-500');
        expect(result).not.toContain('px-4');
        expect(result).not.toContain('py-2');
      });

      it('should handle conditional disabled state', () => {
        const isDisabled = true;
        const baseClasses = 'bg-blue-500 cursor-pointer';
        const disabledClasses = isDisabled && 'bg-gray-300 cursor-not-allowed';

        const result = cn(baseClasses, disabledClasses);

        expect(result).toContain('bg-gray-300');
        expect(result).toContain('cursor-not-allowed');
        expect(result).not.toContain('bg-blue-500');
        expect(result).not.toContain('cursor-pointer');
      });

      it('should handle component prop className override', () => {
        const defaultClasses = 'text-sm text-gray-500';
        const userClassName = 'text-lg text-blue-500';

        const result = cn(defaultClasses, userClassName);

        expect(result).toBe('text-lg text-blue-500');
      });

      it('should handle mixed array and string inputs', () => {
        const conditionalClasses = ['rounded-lg', 'shadow-md'];
        const isLarge = true;

        const result = cn('base', conditionalClasses, isLarge && 'w-full');

        expect(result).toBe('base rounded-lg shadow-md w-full');
      });

      it('should handle arbitrary values', () => {
        const result = cn('w-[200px]', 'h-[100px]');

        expect(result).toBe('w-[200px] h-[100px]');
      });

      it('should resolve arbitrary value conflicts', () => {
        const result = cn('w-[200px]', 'w-[300px]');

        expect(result).toBe('w-[300px]');
      });
    });

    describe('edge cases', () => {
      it('should handle classes with numbers', () => {
        const result = cn('grid-cols-3', 'gap-4');

        expect(result).toBe('grid-cols-3 gap-4');
      });

      it('should handle negative values', () => {
        const result = cn('-mt-4', '-ml-2');

        expect(result).toBe('-mt-4 -ml-2');
      });

      it('should handle important modifier', () => {
        const result = cn('!text-red-500', '!bg-white');

        expect(result).toBe('!text-red-500 !bg-white');
      });

      it('should handle whitespace in class strings', () => {
        const result = cn('  text-red-500  ', '  bg-white  ');

        expect(result).toBe('text-red-500 bg-white');
      });

      it('should handle multiple spaces between classes', () => {
        const result = cn('text-red-500   bg-white');

        expect(result).toBe('text-red-500 bg-white');
      });

      it('should handle deeply nested conditionals', () => {
        const a = true;
        const b = false;
        const c = true;

        const result = cn('base', a && 'a-true', b && 'b-true', c && ['c-true', b && 'cb-true']);

        expect(result).toBe('base a-true c-true');
      });
    });
  });
});
