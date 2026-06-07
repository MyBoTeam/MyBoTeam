import path from 'node:path';
import { app } from 'electron';
import { getDaemonClient } from '../../daemon-bootstrap';
import { getLogCollector } from '../../logging';
import {
  activeGenerations,
  type ChatMessage,
  loadModelPromise,
  setLoadModelPromise,
  state,
} from './server-state';

export async function loadModel(modelId: string): Promise<void> {
  if (!state.isStopping && state.loadedModelId === modelId && state.tokenizer && state.model) {
    getLogCollector().logEnv('INFO', `[HF Server] Model ${modelId} already loaded`);
    return;
  }

  if (loadModelPromise) {
    try {
      await loadModelPromise;
    } catch {}
    if (!state.isStopping && state.loadedModelId === modelId && state.tokenizer && state.model) {
      return;
    }
  }

  const promise = (async () => {
    state.isLoading = true;

    const stoppedAtStart = state.isStopping;
    getLogCollector().logEnv('INFO', `[HF Server] Loading model: ${modelId}`);

    try {
      const { env, AutoTokenizer, AutoModelForCausalLM } = await import(
        '@huggingface/transformers'
      );

      const cacheDir = path.join(app.getPath('userData'), 'hf-models');
      env.localModelPath = cacheDir;
      env.allowRemoteModels = false;

      const tokenizer = await AutoTokenizer.from_pretrained(modelId);

      let quantization: string | null = null;
      let devicePreference: string | null = null;
      try {
        const snap = await getDaemonClient().call('settings.getAll');
        quantization = snap.huggingFaceLocalConfig?.quantization ?? null;
        devicePreference = snap.huggingFaceLocalConfig?.devicePreference ?? null;
      } catch {}

      const envAny = env as any;
      envAny.backends ??= {};
      envAny.backends.onnx ??= {};
      if (devicePreference && devicePreference !== 'auto') {
        envAny.backends.onnx.device = devicePreference;
      } else {
        delete envAny.backends.onnx.device;
      }

      const dtypesToTry: string[] = quantization ? [quantization] : ['q4'];

      let model: any;
      for (const dtype of dtypesToTry) {
        try {
          model = await AutoModelForCausalLM.from_pretrained(modelId, {
            dtype: dtype as any,
          });
          break;
        } catch (err) {
          if (dtype === dtypesToTry[dtypesToTry.length - 1] && dtype !== 'fp32') {
            getLogCollector().logEnv(
              'WARN',
              `[HF Server] Failed to load ${dtype} model, trying fp32: ${err}`,
            );

            model = await AutoModelForCausalLM.from_pretrained(modelId, {
              dtype: 'fp32',
            });
          } else {
            throw err;
          }
        }
      }

      if (state.isStopping || stoppedAtStart) {
        getLogCollector().logEnv(
          'INFO',
          `[HF Server] Stop requested during load of ${modelId}; discarding.`,
        );
        try {
          await model?.dispose?.();
        } catch {}
        throw new DOMException('Load cancelled by stopServer()', 'AbortError');
      }

      if (state.model) {
        const start = Date.now();
        while (activeGenerations > 0 && Date.now() - start < 10000) {
          await new Promise((r) => setTimeout(r, 100));
        }
        try {
          await state.model.dispose?.();
        } catch {}
      }

      state.tokenizer = tokenizer;
      state.model = model;

      state.loadedModelId = modelId;
      getLogCollector().logEnv('INFO', `[HF Server] Model loaded: ${modelId}`);
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      getLogCollector().logEnv(
        isAbort ? 'INFO' : 'ERROR',
        `[HF Server] ${isAbort ? 'Load cancelled' : 'Failed to load model'}: ${modelId}`,
        isAbort ? undefined : { error: String(error) },
      );
      throw error;
    } finally {
      state.isLoading = false;
      setLoadModelPromise(null);
    }
  })();

  setLoadModelPromise(promise);
  return promise;
}

export function formatChatPrompt(messages: ChatMessage[], tokenizer: any): string {
  try {
    if (tokenizer.apply_chat_template) {
      const formatted = tokenizer.apply_chat_template(messages, {
        tokenize: false,
        add_generation_prompt: true,
      });
      return formatted;
    }
  } catch {}

  return `${messages
    .map((m) => {
      if (m.role === 'system') {
        return `System: ${m.content}`;
      }
      if (m.role === 'user') {
        return `User: ${m.content}`;
      }
      return `Assistant: ${m.content}`;
    })
    .join('\n')}\nAssistant:`;
}
