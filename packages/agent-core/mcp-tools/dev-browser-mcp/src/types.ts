export interface SnapshotOptions {
  interactiveOnly?: boolean;
  maxElements?: number;
  viewportOnly?: boolean;
  maxTokens?: number;
  fullSnapshot?: boolean;
  rawTree?: boolean;
  includeBoundingBoxes?: boolean;
  includeAllTextNodes?: boolean;
  preserveSubtrees?: boolean;
}

export const DEFAULT_SNAPSHOT_OPTIONS: SnapshotOptions = {
  interactiveOnly: true,
  maxElements: 300,
  maxTokens: 8000,
};

export interface BrowserNavigateInput {
  url: string;
  page_name?: string;
}

export interface BrowserSnapshotInput {
  page_name?: string;
  interactive_only?: boolean;
  full_snapshot?: boolean;
  max_elements?: number;
  viewport_only?: boolean;
  include_history?: boolean;
  max_tokens?: number;
}

export interface BrowserClickInput {
  ref?: string;
  selector?: string;
  x?: number;
  y?: number;
  position?: 'center' | 'center-lower';
  button?: 'left' | 'right' | 'middle';
  click_count?: number;
  page_name?: string;
}

export interface BrowserTypeInput {
  ref?: string;
  selector?: string;
  text: string;
  press_enter?: boolean;
  page_name?: string;
}

export interface BrowserScreenshotInput {
  page_name?: string;
  full_page?: boolean;
}

export interface BrowserEvaluateInput {
  script: string;
  page_name?: string;
}

export interface BrowserPagesInput {
  action: 'list' | 'close';
  page_name?: string;
}

export interface BrowserKeyboardInput {
  action: 'press' | 'type' | 'down' | 'up';
  key?: string;
  text?: string;
  typing_delay?: number;
  page_name?: string;
}

export interface SequenceAction {
  action: 'click' | 'type' | 'snapshot' | 'screenshot' | 'wait';
  ref?: string;
  selector?: string;
  x?: number;
  y?: number;
  text?: string;
  press_enter?: boolean;
  full_page?: boolean;
  timeout?: number;
}

export interface BrowserSequenceInput {
  actions: SequenceAction[];
  page_name?: string;
}

export interface ScriptAction {
  action:
    | 'goto'
    | 'waitForLoad'
    | 'waitForSelector'
    | 'waitForNavigation'
    | 'findAndFill'
    | 'findAndClick'
    | 'fillByRef'
    | 'clickByRef'
    | 'snapshot'
    | 'screenshot'
    | 'keyboard'
    | 'evaluate';
  url?: string;
  selector?: string;
  ref?: string;
  text?: string;
  key?: string;
  pressEnter?: boolean;
  timeout?: number;
  fullPage?: boolean;
  code?: string;
  skipIfNotFound?: boolean;
}

export interface BrowserScriptInput {
  actions: ScriptAction[];
  page_name?: string;
}

export interface BrowserScrollInput {
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  ref?: string;
  selector?: string;
  position?: 'top' | 'bottom';
  page_name?: string;
}

export interface BrowserHoverInput {
  ref?: string;
  selector?: string;
  x?: number;
  y?: number;
  page_name?: string;
}

export interface BrowserSelectInput {
  ref?: string;
  selector?: string;
  value?: string;
  label?: string;
  index?: number;
  page_name?: string;
}

export interface BrowserWaitInput {
  condition: 'selector' | 'hidden' | 'navigation' | 'network_idle' | 'timeout' | 'function';
  selector?: string;
  script?: string;
  timeout?: number;
  page_name?: string;
}

export interface BrowserFileUploadInput {
  ref?: string;
  selector?: string;
  files: string[];
  page_name?: string;
}

export interface BrowserDragInput {
  source_ref?: string;
  source_selector?: string;
  source_x?: number;
  source_y?: number;
  target_ref?: string;
  target_selector?: string;
  target_x?: number;
  target_y?: number;
  page_name?: string;
}

export interface BrowserGetTextInput {
  ref?: string;
  selector?: string;
  page_name?: string;
}

export interface BrowserIsVisibleInput {
  ref?: string;
  selector?: string;
  page_name?: string;
}

export interface BrowserIsEnabledInput {
  ref?: string;
  selector?: string;
  page_name?: string;
}

export interface BrowserIsCheckedInput {
  ref?: string;
  selector?: string;
  page_name?: string;
}

export interface BrowserIframeInput {
  action: 'enter' | 'exit';
  ref?: string;
  selector?: string;
  page_name?: string;
}

export interface BrowserTabsInput {
  action: 'list' | 'switch' | 'close' | 'wait_for_new';
  index?: number;
  timeout?: number;
  page_name?: string;
}

export interface BrowserCanvasTypeInput {
  text: string;
  position?: 'start' | 'current';
  page_name?: string;
}

export interface BrowserHighlightInput {
  enabled: boolean;
  page_name?: string;
}
