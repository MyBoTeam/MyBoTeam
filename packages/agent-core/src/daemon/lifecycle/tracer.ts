/**
 * Span data structure
 */
export interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: Record<string, unknown>;
  events: Array<{
    name: string;
    time: number;
    attributes?: Record<string, unknown>;
  }>;
}

/**
 * Tracer for daemon lifecycle
 *
 * Creates and manages traces for task execution and shutdown lifecycle.
 */
export class Tracer {
  private spans: Map<string, Span> = new Map();

  /**
   * Start a new span
   */
  startSpan(name: string): Span {
    const span: Span = {
      id: this.generateSpanId(),
      name,
      startTime: Date.now(),
      attributes: {},
      events: [],
    };

    this.spans.set(span.id, span);
    return span;
  }

  /**
   * End a span
   */
  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
    }
  }

  /**
   * Add event to span
   */
  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({
        name,
        time: Date.now(),
        attributes,
      });
    }
  }

  /**
   * Set attribute on span
   */
  setAttribute(spanId: string, key: string, value: unknown): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.attributes[key] = value;
    }
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): Span | null {
    return this.spans.get(spanId) ?? null;
  }

  /**
   * Get all spans
   */
  getSpans(): Span[] {
    return Array.from(this.spans.values());
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
