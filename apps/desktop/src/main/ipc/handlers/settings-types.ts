// Supported UI languages for validation and type safety
export const SUPPORTED_LANGUAGES = ['auto', 'en', 'zh-CN', 'ru', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
