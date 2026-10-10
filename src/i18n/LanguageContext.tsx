import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';
import { safeLocalStorage } from '../utils/browserUtils';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations.en;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeLocalStorage.getItem('moe_portal_lang');
    return (saved === 'dv' || saved === 'en') ? saved : 'en';
  });

  const isRTL = language === 'dv';

  useEffect(() => {
    safeLocalStorage.setItem('moe_portal_lang', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRTL) {
      document.body.classList.add('font-thaana');
      document.body.classList.remove('font-sans');
    } else {
      document.body.classList.add('font-sans');
      document.body.classList.remove('font-thaana');
    }
  }, [language, isRTL]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'dv' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
