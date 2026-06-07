import type { ChatMessage } from './server-state';

export interface HfTensor {
  dims?: number[];
  slice(dim: number | null, idx: number): HfTensor;
  [index: number]: HfTensor;
}

export interface HfTokenizerCallResult {
  input_ids: HfTensor;
  [key: string]: unknown;
}

export interface HfTokenizer {
  (text: string, options?: Record<string, unknown>): HfTokenizerCallResult;
  decode(tokens: HfTensor, options?: { skip_special_tokens?: boolean }): string;
  apply_chat_template(
    messages: ChatMessage[],
    options?: { tokenize?: boolean; add_generation_prompt?: boolean },
  ): string;
}

export interface HfGenerateOptions {
  max_new_tokens: number;
  temperature: number;
  top_p: number;
  do_sample: boolean;
  callback_function?: (output: HfTensor) => void;
  input_ids?: unknown;
  [key: string]: unknown;
}

export interface HfPreTrainedModel {
  generate(options: HfGenerateOptions): Promise<HfTensor>;
  dispose?(): Promise<unknown[]>;
}
