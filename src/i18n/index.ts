import en from './en';
import am from './am';
import om from './om';
import so from './so';
import ar from './ar';

export type LanguageCode = 'en' | 'am' | 'om' | 'so' | 'ar';

interface LanguageMeta {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}

export const languages: LanguageMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ', dir: 'ltr' },
  { code: 'om', label: 'Oromo', nativeLabel: 'Afaan Oromoo', dir: 'ltr' },
  { code: 'so', label: 'Somali', nativeLabel: 'Soomaali', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
];

export type TranslationKeys = typeof en;

const translations: Record<LanguageCode, TranslationKeys> = {
  en,
  am,
  om,
  so,
  ar,
};

export function getTranslation(lang: LanguageCode): TranslationKeys {
  return translations[lang] || en;
}

export function getLanguageDirection(lang: LanguageCode): 'ltr' | 'rtl' {
  const meta = languages.find((l) => l.code === lang);
  return meta?.dir || 'ltr';
}
