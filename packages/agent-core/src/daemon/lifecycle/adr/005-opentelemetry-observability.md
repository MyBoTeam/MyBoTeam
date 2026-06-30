# ADR-005: OpenTelemetry Observability

## Status

Accepted

## Date

2026-06-28

## Context

Daemon processes need observability for monitoring, debugging, and operational insights. This includes logs, metrics, and traces.

## Decision

Implement OpenTelemetry for observability:

1. **Structured JSON logging**: Use structured JSON format with fields: timestamp, level, message, context, correlationId
2. **Metrics**: Emit metrics for uptime, task count, error count, active connections
3. **Traces**: Create traces for task execution and shutdown lifecycle
4. **OpenTelemetry SDK**: Use official OpenTelemetry SDK for Node.js

## Consequences

### Positive
- Industry-standard observability
- Rich telemetry data for monitoring
- Easy integration with existing monitoring systems

### Negative
- Performance impact of telemetry collection
- Additional dependencies
- Configuration complexity

## Alternatives Considered

1. **Console logging only**: Rejected - insufficient for production
2. **Custom metrics**: Rejected - reinventing the wheel
3. **No observability**: Rejected - poor operational visibility

## Implementation Notes

- Log levels: DEBUG, INFO, WARN, ERROR
- Metrics: daemon.uptime, daemon.tasks.active, daemon.tasks.completed, daemon.tasks.failed, daemon.connections.active, daemon.errors.total
- Traces: task execution spans, shutdown lifecycle spans
- OpenTelemetry SDK: `@opentelemetry/sdk-node`
- Exporters: Configurable (console, OTLP, etc.)

## References

- Spec: FR-009
- Assumptions: OpenTelemetry for observability (logs, metrics, traces)