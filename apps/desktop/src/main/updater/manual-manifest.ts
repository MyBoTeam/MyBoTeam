import http from 'node:http';
import https from 'node:https';
import * as Sentry from '@sentry/electron/main';
import { app } from 'electron';
import { gt as semverGt } from 'semver';
import {
  trackUpdateAvailable,
  trackUpdateCheck,
  trackUpdateFailed,
  trackUpdateNotAvailable,
} from '../analytics/events';
import {
  showManualUpdateDialog,
  showNoUpdatesDialog,
  showUpdateCheckFailedDialog,
} from './dialogs';
import { getFeedUrl, getManifestName } from './feed-config';
import { log } from './logger';
import { isTrustedManifestPath } from './origin';
import { recordCheckedNow } from './store';
import { normalizeVersion, parseManifest } from './versioning';

async function fetchManifest(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const get = url.startsWith('http://') ? http.get : https.get;
    let req;
    try {
      req = get(url, (res) => {
        if (res.statusCode !== 200) {
          log('WARN', '[Updater] Manifest fetch non-200', { url, statusCode: res.statusCode });
          resolve(null);
          return;
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      });
    } catch (error) {
      log('ERROR', '[Updater] Manifest fetch threw synchronously', {
        url,
        err: String(error),
      });
      resolve(null);
      return;
    }
    req.on('error', (error) => {
      log('ERROR', '[Updater] Manifest fetch failed', { url, err: String(error) });
      resolve(null);
    });
  });
}

async function reportFailure(
  errorType: 'fetch_failed' | 'invalid_manifest' | 'invalid_version',
  detail: string,
  silent: boolean,
  sentryPhase?: 'parse' | 'version',
): Promise<void> {
  trackUpdateFailed(errorType, detail);
  log('WARN', `[Updater] ${errorType}`, { detail });
  if (sentryPhase) {
    Sentry.captureMessage(`Update check: ${errorType}`, {
      tags: { component: 'updater', phase: sentryPhase },
    });
  }
  if (!silent) {
    await showUpdateCheckFailedDialog();
  }
}

export async function checkForUpdatesManual(
  silent: boolean,
  platform: 'win' | 'linux',
  arch?: 'x64' | 'arm64',
): Promise<void> {
  const feedUrl = getFeedUrl();
  if (!feedUrl) {
    return;
  }

  const manifestName = getManifestName(platform, arch);
  const manifestUrl = `${feedUrl}/${manifestName}`;
  const currentVersion = app.getVersion();

  trackUpdateCheck();

  const raw = await fetchManifest(manifestUrl);
  if (raw === null) {
    await reportFailure('fetch_failed', `Could not fetch ${manifestUrl}`, silent);
    return;
  }

  const info = parseManifest(raw);
  if (!info) {
    await reportFailure('invalid_manifest', `Could not parse ${manifestUrl}`, silent, 'parse');
    return;
  }

  const remoteNorm = normalizeVersion(info.version);
  if (!remoteNorm) {
    await reportFailure(
      'invalid_version',
      `Unparseable remote version: ${info.version}`,
      silent,
      'version',
    );
    return;
  }

  const isAbsolute = info.path.startsWith('http://') || info.path.startsWith('https://');
  if (!isTrustedManifestPath(info.path, feedUrl)) {
    await reportFailure(
      'invalid_manifest',
      `Manifest path origin does not match feed URL: ${info.path}`,
      silent,
      'parse',
    );
    return;
  }

  recordCheckedNow();

  const currentNorm = normalizeVersion(currentVersion);
  if (!currentNorm) {
    trackUpdateFailed('invalid_version', `Unparseable local version: ${currentVersion}`);
    return;
  }

  if (!semverGt(remoteNorm, currentNorm)) {
    trackUpdateNotAvailable();
    if (!silent) {
      await showNoUpdatesDialog();
    }
    return;
  }

  const downloadUrl = isAbsolute ? info.path : `${feedUrl}/${info.path}`;

  trackUpdateAvailable(currentVersion, info.version);
  log('INFO', '[Updater] Manual update available', {
    currentVersion,
    newVersion: info.version,
    downloadUrl,
  });
  await showManualUpdateDialog(currentVersion, info.version, downloadUrl);
}
