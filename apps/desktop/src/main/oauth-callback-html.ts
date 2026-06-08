import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CallbackSettings {
  theme: 'light' | 'dark';
  themeColor: string;
  language: string;
}

interface LocaleStrings {
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorMessage: string;
}

const DEFAULT_LOCALE: LocaleStrings = {
  successTitle: 'Authentication successful',
  successMessage: 'You can close this tab',
  errorTitle: 'Authentication failed',
  errorMessage: 'Missing code or state parameter',
};

const LOCALE_CACHE = new Map<string, LocaleStrings>();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readLocaleStrings(language: string): LocaleStrings {
  if (LOCALE_CACHE.has(language)) {
    return LOCALE_CACHE.get(language)!;
  }

  const candidates: string[] = [
    path.resolve(__dirname, '../../../../apps/web/locales', language, 'common.json'),
  ];
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'locales', language, 'common.json'));
  }

  for (const filePath of candidates) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const section = content?.callback as Record<string, unknown> | undefined;
      if (
        section &&
        typeof section.successTitle === 'string' &&
        typeof section.successMessage === 'string' &&
        typeof section.errorTitle === 'string' &&
        typeof section.errorMessage === 'string'
      ) {
        const strings: LocaleStrings = {
          successTitle: section.successTitle,
          successMessage: section.successMessage,
          errorTitle: section.errorTitle,
          errorMessage: section.errorMessage,
        };
        LOCALE_CACHE.set(language, strings);
        return strings;
      }
    } catch {
      // try next candidate
    }
  }

  return DEFAULT_LOCALE;
}

function buildHtml(params: {
  title: string;
  message: string;
  isError: boolean;
  isDark: boolean;
  themeColor: string;
  autoClose?: boolean;
}): string {
  const themeClass = params.isDark ? 'dark' : 'light';
  const colorClass = `theme-${params.themeColor}`;
  const bgColor = params.isDark ? '#1a1a2e' : '#ffffff';
  const textColor = params.isDark ? '#e0e0e0' : '#1a1a2e';
  const titleColor = params.isError ? '#ef4444' : textColor;

  const safeTitle = escapeHtml(params.title);
  const safeMessage = escapeHtml(params.message);

  const autoCloseScript = params.autoClose
    ? `<script>
setTimeout(function() {
  var w = window;
  try { w.close(); } catch(e) {}
  document.getElementById('fallback-message').classList.remove('hidden');
}, 7000);
</script>`
    : '';

  return (
    '<!DOCTYPE html>' +
    '<html class="' +
    themeClass +
    ' ' +
    colorClass +
    '">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' +
    safeTitle +
    '</title>' +
    '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{' +
    'font-family:"KMR Apparat","Geist",ui-sans-serif,system-ui,sans-serif;' +
    'background:' +
    bgColor +
    ';' +
    'color:' +
    textColor +
    ';' +
    'display:flex;justify-content:center;align-items:center;' +
    'height:100vh;width:100vw' +
    '}' +
    '.container{' +
    'display:flex;flex-direction:row;align-items:center;' +
    'justify-content:center;gap:40px;padding:40px;max-width:700px' +
    '}' +
    '.robot img{width:200px;height:auto}' +
    '.text{text-align:left}' +
    '.title{' +
    'font-size:28px;font-weight:600;' +
    'color:' +
    titleColor +
    ';margin-bottom:12px' +
    '}' +
    '.message{font-size:16px;line-height:1.5}' +
    '.hidden{display:none}' +
    '.fallback{margin-top:16px;font-size:14px;opacity:0.7}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
    '<div class="robot">' +
    '<img src="/robot.png" alt="MyBoTeam Robot" />' +
    '</div>' +
    '<div class="text">' +
    '<div class="title">' +
    safeTitle +
    '</div>' +
    '<div class="message">' +
    safeMessage +
    '</div>' +
    '<div id="fallback-message" class="fallback hidden">' +
    (params.autoClose ? safeMessage : '') +
    '</div>' +
    '</div>' +
    '</div>' +
    autoCloseScript +
    '</body></html>'
  );
}

export { buildHtml, escapeHtml, readLocaleStrings };
