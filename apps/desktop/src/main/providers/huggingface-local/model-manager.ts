import fs from 'node:fs';
import path from 'node:path';
import type { HuggingFaceLocalModelInfo } from '@myboteam/agent-core/common';
import { app } from 'electron';

export type { DownloadProgress, ProgressCallback } from './model-downloader';
export { cancelDownload, downloadModel } from './model-downloader';

export const SUGGESTED_MODELS: HuggingFaceLocalModelInfo[] = [
  {
    id: 'onnx-community/Llama-3.2-1B-Instruct-ONNX',
    displayName: 'Llama 3.2 1B Instruct (ONNX)',
    downloaded: false,
  },
  {
    id: 'onnx-community/Phi-3.5-mini-instruct-onnx',
    displayName: 'Phi-3.5 Mini Instruct (ONNX)',
    downloaded: false,
  },
  {
    id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    displayName: 'Qwen2.5 0.5B Instruct (ONNX)',
    downloaded: false,
  },
  {
    id: 'Xenova/distilgpt2',
    displayName: 'DistilGPT-2 (Tiny, for testing)',
    downloaded: false,
  },
];

function getDefaultCachePath(): string {
  return path.join(app.getPath('userData'), 'hf-models');
}

function ensureCacheDir(cachePath?: string): string {
  const dir = cachePath || getDefaultCachePath();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function listCachedModels(cachePath?: string): HuggingFaceLocalModelInfo[] {
  const cacheDir = cachePath || getDefaultCachePath();
  if (!fs.existsSync(cacheDir)) {
    return [];
  }

  const models: HuggingFaceLocalModelInfo[] = [];

  try {
    const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
    for (const orgEntry of entries) {
      if (!orgEntry.isDirectory()) {
        continue;
      }
      const orgDir = path.join(cacheDir, orgEntry.name);
      const modelEntries = fs.readdirSync(orgDir, { withFileTypes: true });
      for (const modelEntry of modelEntries) {
        if (!modelEntry.isDirectory()) {
          continue;
        }
        const modelDir = path.join(orgDir, modelEntry.name);
        const modelId = `${orgEntry.name}/${modelEntry.name}`;
        const sizeBytes = getDirSize(modelDir);
        models.push({
          id: modelId,
          displayName: modelEntry.name,
          sizeBytes,
          downloaded: true,
        });
      }
    }
  } catch (error) {
    console.warn('[HF Local] Error listing cached models:', error);
  }

  return models;
}

export function deleteModel(
  modelId: string,
  cachePath?: string,
): { success: boolean; error?: string } {
  const cacheDir = ensureCacheDir(cachePath);
  const resolvedCache = path.resolve(cacheDir);

  const normalizedId = path.normalize(modelId);
  if (
    !normalizedId ||
    normalizedId.includes('\0') ||
    path.isAbsolute(normalizedId) ||
    normalizedId.split(path.sep).includes('..')
  ) {
    return { success: false, error: 'Invalid model ID' };
  }

  const modelDir = path.resolve(resolvedCache, normalizedId);

  const rel = path.relative(resolvedCache, modelDir);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return { success: false, error: 'Invalid model ID' };
  }

  if (!fs.existsSync(modelDir)) {
    return { success: false, error: 'Model not found in cache' };
  }

  try {
    fs.rmSync(modelDir, { recursive: true, force: true });

    const orgDir = path.dirname(modelDir);
    const remaining = fs.readdirSync(orgDir);
    if (remaining.length === 0) {
      fs.rmdirSync(orgDir);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function getDirSize(dirPath: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        total += fs.statSync(fullPath).size;
      } else if (entry.isDirectory()) {
        total += getDirSize(fullPath);
      }
    }
  } catch {}
  return total;
}

export function getCachePath(): string {
  return getDefaultCachePath();
}
