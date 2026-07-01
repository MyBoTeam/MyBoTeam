/**
 * State machine for login item states
 * Feature: M3.4 Login Item Auto-Start
 */

import { isValidTransition, LoginItemState, VALID_TRANSITIONS } from '../types/login-item.js';

export { isValidTransition, LoginItemState, VALID_TRANSITIONS };

/**
 * State machine for managing login item state transitions
 */
export class LoginItemStateMachine {
  private currentState: LoginItemState;
  private stateHistory: Array<{ state: LoginItemState; timestamp: string }> = [];

  constructor(initialState: LoginItemState = LoginItemState.Disabled) {
    this.currentState = initialState;
    this.stateHistory.push({
      state: initialState,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get the current state
   */
  getCurrentState(): LoginItemState {
    return this.currentState;
  }

  /**
   * Get the state history
   */
  getStateHistory(): Array<{ state: LoginItemState; timestamp: string }> {
    return [...this.stateHistory];
  }

  /**
   * Attempt to transition to a new state
   * @throws Error if transition is invalid
   */
  transition(to: LoginItemState): void {
    if (!isValidTransition(this.currentState, to)) {
      throw new Error(`Invalid transition from ${this.currentState} to ${to}`);
    }

    this.currentState = to;
    this.stateHistory.push({
      state: to,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Force a state transition (for error recovery)
   */
  forceTransition(to: LoginItemState): void {
    this.currentState = to;
    this.stateHistory.push({
      state: to,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if a transition is valid
   */
  canTransition(to: LoginItemState): boolean {
    return isValidTransition(this.currentState, to);
  }

  /**
   * Reset to initial state
   */
  reset(initialState: LoginItemState = LoginItemState.Disabled): void {
    this.currentState = initialState;
    this.stateHistory = [
      {
        state: initialState,
        timestamp: new Date().toISOString(),
      },
    ];
  }
}
