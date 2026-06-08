import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { createLogger } from '@/utils/logger';
import { enResources } from './locales/en';
import { frResources } from './locales/fr';
import { ruResources } from './locales/ru';
import { zhCNResources } from './locales/zh-CN';

const logger = createLogger('i18n');

export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ru', 'fr'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const NAMESPACES = [
  'common',
  'home',
  'execution',
  'settings',
  'history',
  'errors',
  'sidebar',
] as const;

export const LANGUAGE_STORAGE_KEY = 'openwork-language';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

function updateDocumentDirection(language: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = language;
}

function resolveStoredLanguage(): SupportedLanguage {
  if (typeof localStorage === 'undefined') {
    return 'en';
  }
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh-CN' || stored === 'ru' || stored === 'fr') {
    return stored;
  }

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

    if (typeof window !== 'undefined' && window.myboteam?.setLanguage) {
      const storedPref = getLanguagePreference();
      window.myboteam.setLanguage(storedPref).catch((error) => {
        logger.warn('Failed to sync initial language preference to main process', { error });
      });
    }
  })();

  return initializationPromise;
}

export async function changeLanguage(
  language: 'en' | 'zh-CN' | 'ru' | 'fr' | 'auto',
): Promise<void> {
  const resolvedLanguage = language === 'auto' ? resolveAutoLanguage() : language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(resolvedLanguage);
  updateDocumentDirection(resolvedLanguage);

  if (typeof window !== 'undefined' && window.myboteam?.setLanguage) {
    window.myboteam.setLanguage(language).catch((error) => {
      logger.warn('Failed to sync language preference to main process', { error });
    });
  }
}

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
