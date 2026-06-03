import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { getTranslation, getLanguageDirection, LanguageCode, TranslationKeys } from '@/i18n';

export function useTranslation() {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    storage.getItem('language').then((saved) => {
      if (saved === 'en' || saved === 'am' || saved === 'om' || saved === 'so' || saved === 'ar') {
        setLanguageState(saved);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setLanguageState(code);
    await storage.setItem('language', code);
  }, []);

  const t: TranslationKeys = getTranslation(language);
  const dir = getLanguageDirection(language);

  return { t, language, setLanguage, dir, isRTL: dir === 'rtl' };
}
