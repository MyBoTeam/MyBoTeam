# V0.2.0 Pi Demo Behavioral Reference

Source reference: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0`.

## Lifecycle Expectations

- The demo created a Pi connection with explicit `connect`, `disconnect`, `send`, `receive`, and `isAlive` operations.
- Connection state distinguished connected, disconnected, crashed, and error outcomes.
- Process stderr and crash details were observable for diagnostics.
- Disconnect attempted graceful shutdown before considering the connection closed.

## Error Expectations

- RPC send errors were wrapped as Pi adapter errors.
- Error listeners were notified before the error was rethrown.
- Crashes and startup failures were surfaced as explicit failure events rather than hidden retries.

## Timeout And Backpressure Expectations

- Send and receive paths supported timeout behavior.
- Send guarded against write-queue backpressure.
- Receive accepted abort signaling.

## Credential Expectations

- The demo treated auth as runtime configuration and diagnostics, not as task output.
- MAO-66 must preserve the behavior expectation without copying the demo process transport or writing provider secrets to generated files.

## Message Expectations

- Successful request/response pairs emitted a user message and agent response pair for downstream observers.
- MAO-66 should preserve the user-visible lifecycle result through existing task messages and events, not through the V0.2.0 JSONL frame API.
