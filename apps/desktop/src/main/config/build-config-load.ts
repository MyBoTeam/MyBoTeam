import fs from 'node:fs';
import path from 'node:path';
import { parse as dotenvParse } from 'dotenv';
import { app } from 'electron';
import { z } from 'zod';

const buildConfigSchema = z.object({
  buildEnvVersion: z.string().default(''),
  mixpanelToken: z.string().default(''),
  gaApiSecret: z.string().default(''),
  gaMeasurementId: z.string().default(''),
  sentryDsn: z.string().default(''),
  myboteamGatewayUrl: z.string().default(''),
  buildId: z.string().default(''),
  myboteamUpdaterUrl: z.string().default(''),
});

export type BuildConfig = z.infer<typeof buildConfigSchema>;

let cachedConfig: BuildConfig | null = null;

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value && value.length > 0) {
      return value;
    }
  }
  return '';
}

export function loadBuildConfig(): BuildConfig {
  if (cachedConfig) return cachedConfig;

  const buildEnvPath = app.isPackaged
    ? path.join(process.resourcesPath, 'build.env')
    : path.join(process.env.APP_ROOT || '', 'build.env');

  let raw: Record<string, string> = {};
  let loadedFromFile = false;
  try {
    const content = fs.readFileSync(buildEnvPath, 'utf8');
    raw = dotenvParse(content);
    loadedFromFile = true;
  } catch {}

  const parsed = buildConfigSchema.safeParse({
    buildEnvVersion: firstNonEmpty(raw.BUILD_ENV_VERSION, process.env.BUILD_ENV_VERSION),
    mixpanelToken: firstNonEmpty(raw.MIXPANEL_TOKEN, process.env.MIXPANEL_TOKEN),
    gaApiSecret: firstNonEmpty(raw.GA_API_SECRET, process.env.GA_API_SECRET),
    gaMeasurementId: firstNonEmpty(raw.GA_MEASUREMENT_ID, process.env.GA_MEASUREMENT_ID),
    sentryDsn: firstNonEmpty(raw.SENTRY_DSN, process.env.SENTRY_DSN),
    myboteamGatewayUrl: firstNonEmpty(raw.MYBOTEAM_GATEWAY_URL, process.env.MYBOTEAM_GATEWAY_URL),
    buildId: firstNonEmpty(raw.MYBOTEAM_BUILD_ID, process.env.MYBOTEAM_BUILD_ID),
    myboteamUpdaterUrl: firstNonEmpty(
      raw.MYBOTEAM_UPDATER_URL,
      app.isPackaged ? undefined : process.env.MYBOTEAM_UPDATER_URL,
    ),
  });

  if (!parsed.success) {
    console.warn('[BuildConfig] Validation failed, using empty defaults:', parsed.error.message);
    cachedConfig = buildConfigSchema.parse({});
  } else {
    cachedConfig = parsed.data;
  }

  if (cachedConfig.buildEnvVersion) {
    const source = loadedFromFile && raw.BUILD_ENV_VERSION ? 'build.env' : 'process.env';
    console.log(
      `[BuildConfig] Loaded build config (buildEnvVersion=${cachedConfig.buildEnvVersion}, source=${source})`,
    );
  } else if (
    cachedConfig.mixpanelToken ||
    cachedConfig.gaApiSecret ||
    cachedConfig.sentryDsn ||
    cachedConfig.myboteamGatewayUrl ||
    cachedConfig.myboteamUpdaterUrl
  ) {
    console.log('[BuildConfig] Loaded build config from process.env (dev / custom fallback)');
  } else {
    console.log('[BuildConfig] No build.env or env vars found — running in OSS mode');
  }

  return cachedConfig;
}

export function getBuildConfig(): BuildConfig {
  if (!cachedConfig) {
    return loadBuildConfig();
  }
  return cachedConfig;
}
