/**
 * Web i18n Configuration (Platform-Agnostic, Optional Electron IPC)
 *
 * All translations are bundled as static imports. Language preference is
 * persisted in localStorage. This module remains platform-agnostic, but when running
 * in an Electron renderer, it will call window.myboteam.setLanguage() (IPC to main process)
 * if present, to sync the language preference with the main process. This integration is
 * fully optional: calls are guarded by (typeof window !== 'undefined' && window.myboteam?.setLanguage)
 * and are fire-and-forget with error logging. See the symbols window.myboteam.setLanguage and
 * getLanguagePreference in this module for the conditional Electron integration logic.
 */

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { createLogger } from '../lib/logger';
import { enResources } from './locales/en';
import { frResources } from './locales/fr';
import { ruResources } from './locales/ru';
import { zhCNResources } from './locales/zh-CN';

const logger = createLogger('i18n');

// Supported languages and namespaces
export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ru', 'fr'] as const;
export const NAMESPACES = [
  'common',
  'home',
  'execution',
  'settings',
  'history',
  'errors',
  'sidebar',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type Namespace = (typeof NAMESPACES)[number];

export const LANGUAGE_STORAGE_KEY = 'openwork-language';

// Flag to track initialization
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

function updateDocumentDirection(language: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = language;
}

/**
 * Read the stored language preference from localStorage.
 * Returns the concrete language to use (resolves 'auto' via navigator).
 */
function resolveStoredLanguage(): SupportedLanguage {
  if (typeof localStorage === 'undefined') {
    return 'en';
  }
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh-CN' || stored === 'ru' || stored === 'fr') {
    return stored;
  }
  // 'auto' or missing — detect from browser
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  if (nav.startsWith('zh')) {
    return 'zh-CN';
  }
  if (nav.startsWith('ru')) {
    return 'ru';
  }
  if (nav.startsWith('fr')) {
    return 'fr';
  }
  return 'en';
}

/**
 * Initialize i18n with bundled translations
 */
export async function initI18n(): Promise<void> {
  if (isInitialized) {
    return;
  }
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const initialLanguage = resolveStoredLanguage();

    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources: {
          en: enResources,
          'zh-CN': zhCNResources,
          ru: ruResources,
          fr: frResources,
        },
        lng: initialLanguage,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: NAMESPACES as unknown as string[],

        interpolation: {
          escapeValue: false,
        },

        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        },

        debug: import.meta.env.DEV,

        returnEmptyString: false,

        react: {
          useSuspense: false,
        },
      });

    updateDocumentDirection(initialLanguage);
    isInitialized = true;
    logger.info(`Initialized with language: ${initialLanguage}`);
    // Sync initial language to main process so the agent reflects the stored preference
    if (typeof window !== 'undefined' && window.myboteam?.setLanguage) {
      const storedPref = getLanguagePreference();
      window.myboteam.setLanguage(storedPref).catch((error) => {
        logger.warn('Failed to sync initial language preference to main process', { error });
      });
    }
  })();

  return initializationPromise;
}

/**
 * Change language and persist to localStorage and main-process DB (Electron only)
 */
export async function changeLanguage(
  language: 'en' | 'zh-CN' | 'ru' | 'fr' | 'auto',
): Promise<void> {
  const resolvedLanguage = language === 'auto' ? resolveAutoLanguage() : language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(resolvedLanguage);
  updateDocumentDirection(resolvedLanguage);
  // Persist to main process so the agent reads the correct language
  if (typeof window !== 'undefined' && window.myboteam?.setLanguage) {
    window.myboteam.setLanguage(language).catch((error) => {
      logger.warn('Failed to sync language preference to main process', { error });
    });
  }
}

/**
 * Get the current language preference from localStorage
 */
export function getLanguagePreference(): 'en' | 'zh-CN' | 'ru' | 'fr' | 'auto' {
  if (typeof localStorage === 'undefined') {
    return 'auto';
  }
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (
    stored === 'en' ||
    stored === 'zh-CN' ||
    stored === 'ru' ||
    stored === 'fr' ||
    stored === 'auto'
  ) {
    return stored;
  }
  return 'auto';
}

function resolveAutoLanguage(): SupportedLanguage {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  if (nav.startsWith('zh')) {
    return 'zh-CN';
  }
  if (nav.startsWith('ru')) {
    return 'ru';
  }
  if (nav.startsWith('fr')) {
    return 'fr';
  }
  return 'en';
}

export default i18n;
