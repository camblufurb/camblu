import React, { createContext, useContext, useMemo } from 'react';

export type SupportedLocale = 'pt-BR';

const dictionary = {
  'pt-BR': {
    'app.title': 'CAMBLU',
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
    'sponsors.label': 'Apoio e Patrocínio Institucional',
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.downloadPdf': 'Baixar PDF',
    'common.downloadPng': 'Baixar PNG',
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)['pt-BR'];

interface I18nContextValue {
  locale: SupportedLocale;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: 'pt-BR',
      t: (key: TranslationKey) => dictionary['pt-BR'][key],
    }),
    [],
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
