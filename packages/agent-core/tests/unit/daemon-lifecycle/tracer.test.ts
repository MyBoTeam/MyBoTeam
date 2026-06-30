import { beforeEach, describe, expect, it } from 'vitest';
import { Tracer } from '../../../src/daemon/lifecycle/tracer';

describe('Tracer', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = new Tracer();
  });

  describe('startSpan()', () => {
    it('should start a span', () => {
      const span = tracer.startSpan('test-span');

      expect(span).toBeDefined();
      expect(span.name).toBe('test-span');
      expect(span.startTime).toBeGreaterThan(0);
    });

    it('should generate span ID', () => {
      const span = tracer.startSpan('test-span');

      expect(span.id).toBeTypeOf('string');
      expect(span.id.length).toBeGreaterThan(0);
    });
  });

  describe('endSpan()', () => {
    it('should end a span', () => {
      const span = tracer.startSpan('test-span');
      tracer.endSpan(span.id);

      const completedSpan = tracer.getSpan(span.id);
      expect(completedSpan?.endTime).toBeGreaterThan(0);
    });

    it('should calculate duration', () => {
      const span = tracer.startSpan('test-span');
      tracer.endSpan(span.id);

      const completedSpan = tracer.getSpan(span.id);
      expect(completedSpan?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addEvent()', () => {
    it('should add event to span', () => {
      const span = tracer.startSpan('test-span');
      tracer.addEvent(span.id, 'test-event', { key: 'value' });

      const completedSpan = tracer.getSpan(span.id);
      expect(completedSpan?.events).toHaveLength(1);
      expect(completedSpan?.events[0].name).toBe('test-event');
    });
  });

  describe('setAttribute()', () => {
    it('should set attribute on span', () => {
      const span = tracer.startSpan('test-span');
      tracer.setAttribute(span.id, 'test-attr', 'value');

      const completedSpan = tracer.getSpan(span.id);
      expect(completedSpan?.attributes['test-attr']).toBe('value');
    });
  });

  describe('getSpans()', () => {
    it('should return all spans', () => {
      tracer.startSpan('span-1');
      tracer.startSpan('span-2');

      const spans = tracer.getSpans();
      expect(spans).toHaveLength(2);
    });
  });

  describe('getSpan()', () => {
    it('should return span by ID', () => {
      const span = tracer.startSpan('test-span');
      const retrieved = tracer.getSpan(span.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-span');
    });

    it('should return null for non-existent span', () => {
      const retrieved = tracer.getSpan('non-existent');

      expect(retrieved).toBeNull();
    });
  });
});
