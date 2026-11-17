import React, { createContext, useContext, useMemo, useState } from 'react';

export type SupportedLocale = 'pt-BR' | 'en-US';

const STORAGE_KEY = 'camblu.locale';

const dictionary = {
  'pt-BR': {
    'app.title': 'CAMBLU',
    'app.subtitle': 'Medicina FURB · Desde 1990',
    'skip.toContent': 'Pular para o conteúdo principal',
    'nav.home': 'Início',
    'nav.events': 'Eventos',
    'nav.shop': 'Lojinha',
    'nav.club': 'Clube CAMBLU',
    'nav.transparency': 'Transparência',
    'nav.academic': 'Acadêmico',
    'nav.more': 'Institucional',
    'nav.calendar': 'Calendário',
    'nav.editais': 'Editais',
    'nav.demands': 'Demandas & Ajuda',
    'nav.cambluMulher': 'CAMBLU Mulher',
    'nav.about': 'Sobre & Espaços',
    'nav.medfurb': 'MEDFURB',
    'nav.gestoes': 'Gestões',
    'nav.ligas': 'Ligas Acadêmicas',
    'nav.secimed': 'SECIMED',
    'nav.anais': 'Anais SECIMED',
    'nav.freshman': 'Manual do Calouro',
    'nav.myTickets': 'Meus Ingressos',
    'nav.certificates': 'Certificados',
    'nav.memberCard': 'Cartão do Clube',
    'nav.profile': 'Meu Perfil',
    'nav.admin': 'Painel Admin (/back)',
    'auth.signInGoogle': 'Entrar com Google',
    'auth.signOut': 'Sair',
    'auth.completeProfile': 'Completar cadastro',
    'theme.toggle': 'Alternar tema claro/escuro',
    'lang.toggle': 'Mudar idioma para inglês',
    'sponsors.label': 'Apoio e Patrocínio Institucional',
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.downloadPdf': 'Baixar PDF',
    'common.downloadPng': 'Baixar PNG',
  },
  'en-US': {
    'app.title': 'CAMBLU',
    'app.subtitle': 'FURB Medicine · Since 1990',
    'skip.toContent': 'Skip to main content',
    'nav.home': 'Home',
    'nav.events': 'Events',
    'nav.shop': 'Store',
    'nav.club': 'CAMBLU Club',
    'nav.transparency': 'Transparency',
    'nav.academic': 'Academic',
    'nav.more': 'About',
    'nav.calendar': 'Calendar',
    'nav.editais': 'Grants & Calls',
    'nav.demands': 'Support & Requests',
    'nav.cambluMulher': 'CAMBLU Women',
    'nav.about': 'About & Spaces',
    'nav.medfurb': 'MEDFURB',
    'nav.gestoes': 'Board History',
    'nav.ligas': 'Academic Leagues',
    'nav.secimed': 'SECIMED',
    'nav.anais': 'SECIMED Proceedings',
    'nav.freshman': 'Freshman Guide',
    'nav.myTickets': 'My Tickets',
    'nav.certificates': 'Certificates',
    'nav.memberCard': 'Member Card',
    'nav.profile': 'My Profile',
    'nav.admin': 'Admin Console (/back)',
    'auth.signInGoogle': 'Sign in with Google',
    'auth.signOut': 'Sign out',
    'auth.completeProfile': 'Complete profile',
    'theme.toggle': 'Toggle light/dark theme',
    'lang.toggle': 'Switch language to Portuguese',
    'sponsors.label': 'Institutional Sponsors',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.downloadPdf': 'Download PDF',
    'common.downloadPng': 'Download PNG',
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)['pt-BR'];

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'pt-BR';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en-US' || stored === 'pt-BR') return stored;
  return 'pt-BR';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(resolveInitialLocale);

  const setLocale = (next: SupportedLocale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'pt-BR' ? 'en-US' : 'pt-BR');
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: (key: TranslationKey) => dictionary[locale][key] ?? dictionary['pt-BR'][key],
    }),
    [locale],
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return ctx;
}
