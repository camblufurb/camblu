import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FURB_INSTITUTIONS, HOME_CAROUSEL_SLIDES } from '../data/institutional';
import { InstitutionLogo, type InstitutionLogoId } from '../components/InstitutionLogo';
import { M3Carousel } from '../components/M3Carousel';
import { M3MultiBrowseCarousel } from '../components/M3MultiBrowseCarousel';
import { Icon } from '../components/Icon';
import { CambluCrest } from '../components/SponsorLogos';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';

type PortalCategoryId = 'graduacao' | 'ciencia' | 'servicos' | 'gestao';

interface PortalAreaCard {
  id: string;
  to: string;
  title: string;
  summary: string;
  cta: string;
  icon: string;
}

const FLAGSHIP_PILLARS: PortalAreaCard[] = [
  {
    id: 'sobre',
    to: '/sobre',
    title: 'O CAMBLU e Nossos Espaços',
    summary:
      'Conheça nossa atuação estatutária desde 1990 e as salas de convivência, coworking e descanso no Edifício Cristina.',
    cta: 'Saiba mais',
    icon: 'apartment',
  },
  {
    id: 'eventos',
    to: '/eventos',
    title: 'Eventos & Certificados',
    summary:
      'Inscreva-se em simpósios e jornadas com QR Code integrado, acompanhe sua presença e emita certificados de AACCs.',
    cta: 'Explorar eventos',
    icon: 'confirmation_number',
  },
  {
    id: 'lojinha',
    to: '/lojinha',
    title: 'Lojinha Oficial',
    summary:
      'Moletons, camisetas, garrafas e acessórios da Medicina FURB com compra digital e retirada presencial no campus.',
    cta: 'Ver produtos',
    icon: 'shopping_bag',
  },
  {
    id: 'clube',
    to: '/clube',
    title: 'Clube CAMBLU',
    summary:
      'Apoie os projetos do Centro Acadêmico e aproveite descontos na Lojinha, isenções em eventos e cartão digital.',
    cta: 'Conhecer planos',
    icon: 'workspace_premium',
  },
];

const JOURNEY_TABS: {
  id: PortalCategoryId;
  label: string;
  icon: string;
  headline: string;
  description: string;
  items: PortalAreaCard[];
}[] = [
  {
    id: 'graduacao',
    label: 'Graduação & Calouros',
    icon: 'school',
    headline: 'Apoio completo do primeiro semestre ao internato',
    description:
      'Guias práticos para calouros, visão institucional do curso acreditado pelo SAEME e papel de cada entidade estudantil.',
    items: [
      {
        id: 'tab-medfurb',
        to: '/medfurb',
        title: 'Sobre a MEDFURB',
        summary: 'Acreditação SAEME, diretoria, auxílios estudantis, estágios optativos e normas de TCC.',
        cta: 'Acessar guia do curso',
        icon: 'medical_services',
      },
      {
        id: 'tab-sobre',
        to: '/sobre',
        title: 'Sobre o CAMBLU',
        summary: 'Conheça a atuação estatutária do Centro Acadêmico desde 1990, suas diretorias e salas no Edifício Cristina.',
        cta: 'Conhecer o CAMBLU',
        icon: 'apartment',
      },
      {
        id: 'tab-calouro',
        to: '/manual-do-calouro',
        title: 'Manual do Calouro',
        summary: 'Checklist de boas-vindas, Cerimônia do Jaleco, linhagens, sistemas FURB e orientações iniciais.',
        cta: 'Abrir manual',
        icon: 'menu_book',
      },
    ],
  },
  {
    id: 'ciencia',
    label: 'Ciência, Ligas & Editais',
    icon: 'science',
    headline: 'Pesquisa, extensão e fomento acadêmico',
    description:
      'Acesse a Semana Científica de Medicina, as produções indexadas nos Anais, nossas 35 ligas acadêmicas e editais de apoio.',
    items: [
      {
        id: 'tab-ligas',
        to: '/ligas',
        title: '35 Ligas Acadêmicas',
        summary: 'Catálogo completo das ligas ativas da MEDFURB filtrável por especialidade com canais oficiais.',
        cta: 'Explorar ligas',
        icon: 'biotech',
      },
      {
        id: 'tab-secimed',
        to: '/secimed',
        title: 'SECIMED',
        summary: 'A Semana Científica de Medicina da FURB: palestras, workshops práticos e mostra científica.',
        cta: 'Conhecer a SECIMED',
        icon: 'prescriptions',
      },
      {
        id: 'tab-anais',
        to: '/secimed/anais-secimed',
        title: 'Anais SECIMED (ISSN)',
        summary: 'Edições publicadas em acesso aberto com revisão duplo-cega por pares e repositório Zenodo.',
        cta: 'Consultar Anais',
        icon: 'article',
      },
      {
        id: 'tab-editais',
        to: '/editais',
        title: 'Editais de Apoio',
        summary: 'Chamadas E-PAF, E-PAATC, E-PAFLIEC e editais eleitorais com PDF e formulários de envio.',
        cta: 'Ver editais',
        icon: 'description',
      },
    ],
  },
  {
    id: 'servicos',
    label: 'Serviços & Carteira Digital',
    icon: 'qr_code_2',
    headline: 'Ingressos, certificados e benefícios em um só lugar',
    description:
      'Ferramentas digitais para acompanhar sua presença nos eventos, validar documentos oficiais e gerenciar sua conta.',
    items: [
      {
        id: 'tab-ingressos',
        to: '/meus-ingressos',
        title: 'Meus Ingressos',
        summary: 'QR Codes de acesso pessoal para credenciamento nos eventos e transferência segura por CPF.',
        cta: 'Abrir ingressos',
        icon: 'confirmation_number',
      },
      {
        id: 'tab-certificados',
        to: '/certificados',
        title: 'Certificados & Validação',
        summary: 'Download em PDF ou PNG após presença confirmada e conferência pública por código.',
        cta: 'Emitir ou validar',
        icon: 'verified',
      },
      {
        id: 'tab-cartao',
        to: '/clube/cartao',
        title: 'Cartão Digital do Clube',
        summary: 'Identificação interativa para assinantes do Clube CAMBLU desbloquearem vantagens.',
        cta: 'Ver cartão',
        icon: 'badge',
      },
      {
        id: 'tab-perfil',
        to: '/perfil',
        title: 'Meu Perfil Acadêmico',
        summary: 'Atualize CPF, turma, WhatsApp e tamanho de camiseta com sincronização via conta Google.',
        cta: 'Acessar perfil',
        icon: 'person',
      },
    ],
  },
  {
    id: 'gestao',
    label: 'Transparência & Acolhimento',
    icon: 'monitoring',
    headline: 'Contas abertas, agenda unificada e escuta ativa',
    description:
      'Acompanhe o uso dos recursos estudantis, participe das pautas do curso e conte com nosso canal de acolhimento.',
    items: [
      {
        id: 'tab-transparencia',
        to: '/transparencia',
        title: 'Transparência & Atas',
        summary: 'Indicadores financeiros mensais, despesas por categoria, mapa de calor anual e atas de reunião.',
        cta: 'Ver transparência',
        icon: 'analytics',
      },
      {
        id: 'tab-calendario',
        to: '/calendario',
        title: 'Calendário Acadêmico',
        summary: 'Agenda unificada com eventos do CAMBLU, atividades das ligas e prazos de editais (.ics).',
        cta: 'Abrir calendário',
        icon: 'calendar_month',
      },
      {
        id: 'tab-gestoes',
        to: '/gestoes',
        title: 'Gestões do CAMBLU',
        summary: 'Diretorias eleitas, integrantes e propostas que conduzem o Centro Acadêmico ano a ano.',
        cta: 'Conhecer gestões',
        icon: 'groups',
      },
      {
        id: 'tab-demandas',
        to: '/demandas',
        title: 'Demandas & CAMBLU Mulher',
        summary: 'Envie solicitações para a diretoria ou acesse o canal sigiloso de escuta e apoio CAMBLU Mulher.',
        cta: 'Enviar demanda',
        icon: 'support_agent',
      },
    ],
  },
];

const DIRECTORY_SLIDES: PortalAreaCard[] = [
  ...FLAGSHIP_PILLARS,
  {
    id: 'dir-instituicoes',
    to: '/medfurb/instituicoes',
    title: 'Instituições MEDFURB',
    summary: 'CAMBLU, DCE FURB, AAARIH e IFMSA Brazil FURB detalhados em uma página dedicada.',
    cta: 'Acessar',
    icon: 'handshake',
  },
  {
    id: 'dir-ligas',
    to: '/ligas',
    title: '35 Ligas Acadêmicas',
    summary: 'Explore especialidades clínicas, cirúrgicas e de saúde coletiva com contatos diretos.',
    cta: 'Explorar',
    icon: 'biotech',
  },
  {
    id: 'dir-transparencia',
    to: '/transparencia',
    title: 'Transparência Pública',
    summary: 'Acompanhe receitas, investimentos em projetos estudantis e atas das reuniões.',
    cta: 'Visualizar',
    icon: 'monitoring',
  },
  {
    id: 'dir-mulher',
    to: '/camblu-mulher',
    title: 'CAMBLU Mulher',
    summary: 'Canal de acolhimento sigiloso, orientação jurídica e rede de apoio às estudantes.',
    cta: 'Saiba mais',
    icon: 'shield_with_heart',
  },
];

const HOME_FAQS = [
  {
    q: 'Onde encontro informações detalhadas sobre DCE, Atlética AAARIH e IFMSA?',
    a: 'Reunimos a explicação completa de todas as entidades representativas da Medicina FURB na página dedicada de Instituições Estudantis.',
    to: '/medfurb/instituicoes',
    cta: 'Ir para Instituições Estudantis',
  },
  {
    q: 'Como faço para acessar as salas do CAMBLU no Edifício Cristina?',
    a: 'Na página Sobre & Espaços você conhece a Sala de Convivência, o Coworking e a Sala de Descanso, além de como solicitar a senha atualizada com a gestão.',
    to: '/sobre',
    cta: 'Ver Sobre & Espaços',
  },
  {
    q: 'Onde emito meus certificados após participar de eventos e da SECIMED?',
    a: 'Após validar seu QR Code na entrada do evento, seus certificados ficam disponíveis para download em PDF e PNG na área de Certificados.',
    to: '/certificados',
    cta: 'Abrir Meus Certificados',
  },
  {
    q: 'Como entrar em contato com o CAMBLU sobre demandas da turma ou relatos sigilosos?',
    a: 'Use a página Enviar Demanda para encaminhar sua pauta diretamente por assunto, ou acesse o CAMBLU Mulher para canais especializados de apoio.',
    to: '/demandas',
    cta: 'Enviar uma demanda',
  },
];

export function HomePage() {
  const [activeTabId, setActiveTabId] = useState<PortalCategoryId>('graduacao');
  const activeTab = JOURNEY_TABS.find((t) => t.id === activeTabId) || JOURNEY_TABS[0];

  const heroCarouselItems = HOME_CAROUSEL_SLIDES.map((slide) => ({
    id: slide.id,
    title: slide.title,
    render: ({ isPrimary }: { isPrimary: boolean }) => (
      <div
        className="m3-mb-slide-card"
        style={{
          background: `radial-gradient(circle at 86% 18%, rgb(237 209 110 / 0.24), transparent 46%), linear-gradient(135deg, ${slide.accent}, #071b13)`,
        }}
      >
        <div className="m3-mb-slide-meta">
          <Icon name={slide.icon} size={24} />
          <span className="m3-label-large m3-mb-slide-badge">{slide.badge}</span>
        </div>

        <div className="m3-mb-slide-body">
          <h3 className="m3-mb-slide-title" style={{ color: '#ffffff', margin: 0 }}>
            {slide.title}
          </h3>
          <p className="m3-mb-slide-desc" style={{ color: '#dfeee5', margin: 0 }}>
            {slide.subtitle}
          </p>
          <div className="m3-mb-slide-cta">
            <Link
              to={slide.to}
              tabIndex={isPrimary ? 0 : -1}
              className="m3-btn m3-btn--gold"
            >
              <span>{slide.ctaLabel}</span>
              <Icon name="arrow_forward" size={18} className="m3-icon-shift" />
            </Link>
          </div>
        </div>
      </div>
    ),
  }));

  const multiBrowseItems = DIRECTORY_SLIDES.map((area) => ({
    id: area.id,
    title: area.title,
    content: (
      <div
        style={{
          minBlockSize: '15.5rem',
          padding: '1.5rem',
          background: 'var(--md-sys-color-surface-container-lowest)',
          display: 'grid',
          alignContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          <div
            style={{
              inlineSize: '2.75rem',
              blockSize: '2.75rem',
              borderRadius: 'var(--md-sys-shape-corner-md)',
              background: 'var(--camblu-action-blue-container)',
              color: 'var(--camblu-action-blue)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name={area.icon} size={23} />
          </div>
          <h3>{area.title}</h3>
          <p className="text-muted">{area.summary}</p>
        </div>

        <Link to={area.to} className="m3-btn m3-btn--text" style={{ justifySelf: 'start', paddingInlineStart: 0 }}>
          <span>{area.cta}</span>
          <Icon name="arrow_forward" size={18} className="m3-icon-shift" />
        </Link>
      </div>
    ),
  }));

  return (
    <div>
      {/* 1. Hero Editorial — Apresentação Geral do Portal (Estilo Google for Education) */}
      <section className="page-section container m3-motion-hero">
        <div
          className="m3-card m3-card--forest page-hero-card page-hero-card--split"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 90% 14%, rgb(237 209 110 / 0.22), transparent 42%), linear-gradient(140deg, #071b13 0%, #0f3325 58%, #184b37 100%)',
          }}
        >
          <div className="m3-hero-copy page-hero-inner" style={{ maxInlineSize: '46rem', flex: '1 1 18rem' }}>
            <AnimatedClimateTitle
              tone="light"
              accessibleHeading="CAMBLU — Centro Acadêmico de Medicina de Blumenau"
            >
              CAMBLU
            </AnimatedClimateTitle>
            <div className="home-hero-roboto-subtitle">Centro Acadêmico de Medicina de Blumenau</div>

            <p className="page-hero-desc">
              Um único portal para acessar eventos, certificados, ligas acadêmicas, manual do calouro, transparência
              financeira, lojinha oficial e canais de acolhimento da MEDFURB.
            </p>
          </div>

          <div className="m3-hero-emblem home-hero-emblem">
            <CambluCrest size={140} variant="clean" />
          </div>
        </div>
      </section>

      {/* 2. Os 4 Pilares Principais do Portal (como "Educação para hoje e para o futuro") */}
      <section className="page-section container" style={{ paddingBlockStart: '1rem', display: 'grid', gap: '1.75rem' }}>
        <div className="m3-motion-from-start" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.45rem' }}>
          <h2>Tudo o que o portal oferece para a sua jornada na Medicina FURB</h2>
          <p className="text-muted">
            Cada área do site foi organizada em páginas próprias. Escolha o destino que deseja explorar:
          </p>
        </div>

        <div className="grid-cards">
          {FLAGSHIP_PILLARS.map((pillar, idx) => (
            <article
              key={pillar.id}
              className="m3-card m3-card--interactive m3-motion-stagger"
              style={
                {
                  '--stagger-i': idx,
                  display: 'grid',
                  gap: '1rem',
                  alignContent: 'space-between',
                } as React.CSSProperties
              }
            >
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <div
                  style={{
                    inlineSize: '2.9rem',
                    blockSize: '2.9rem',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    background: 'var(--camblu-action-blue-container)',
                    color: 'var(--camblu-action-blue)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name={pillar.icon} size={24} />
                </div>
                <h3>{pillar.title}</h3>
                <p className="text-muted">{pillar.summary}</p>
              </div>

              <Link to={pillar.to} className="m3-btn m3-btn--text" style={{ justifySelf: 'start', paddingInlineStart: 0 }}>
                <span>{pillar.cta}</span>
                <Icon name="arrow_forward" size={18} className="m3-icon-shift" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Resumo das Instituições Estudantis da MEDFURB */}
      <section className="page-section container" style={{ paddingBlockStart: '0.5rem', display: 'grid', gap: '1.5rem' }}>
        <div className="m3-motion-from-start" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.45rem' }}>
          <h2>Instituições Estudantis da Medicina FURB</h2>
          <p className="text-muted">
            Conheça resumidamente o papel de cada entidade acadêmica, esportiva, humanitária e representativa do curso.
          </p>
        </div>

        <div className="grid-cards">
          {FURB_INSTITUTIONS.map((inst, idx) => (
            <article
              key={inst.id}
              className="m3-card m3-motion-stagger"
              style={
                {
                  '--stagger-i': idx,
                  display: 'grid',
                  gap: '0.85rem',
                  alignContent: 'start',
                } as React.CSSProperties
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <InstitutionLogo id={inst.id as InstitutionLogoId} size="3.5rem" alt={`Logo ${inst.acronym}`} />
                <div>
                  <h3>{inst.acronym}</h3>
                  <span className="text-muted" style={{ fontSize: '0.82rem', display: 'block' }}>
                    {inst.name}
                  </span>
                </div>
              </div>

              <p className="text-muted">{inst.summary}</p>
            </article>
          ))}
        </div>

        <div>
          <Link to="/medfurb/instituicoes" className="m3-btn m3-btn--blue">
            <span>Explorar Instituições Estudantis em detalhes</span>
            <Icon name="arrow_forward" size={18} className="m3-icon-shift" />
          </Link>
        </div>
      </section>

      {/* 4. Carrossel M3 Hero Showcase ("Em um pacote seguro e flexível") */}
      <section className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="m3-motion-from-end" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.4rem' }}>
            <h2>Conheça nossos espaços, eventos e frentes de atuação</h2>
            <p className="text-muted">
              Navegue pelos destaques para ir direto à página completa de cada frente estudantil.
            </p>
          </div>
          <M3MultiBrowseCarousel label="Destaques de áreas do CAMBLU" items={heroCarouselItems} />
        </div>
      </section>

      {/* 4. Navegação por Perfil e Momento Acadêmico (Inspirada nas abas do Google for Education) */}
      <section className="page-section container" style={{ display: 'grid', gap: '1.75rem' }}>
        <div className="m3-motion-from-start" style={{ display: 'grid', gap: '0.5rem', textAlign: 'center', justifyItems: 'center' }}>
          <h2>Uma estrutura pensada para cada necessidade do estudante</h2>
          <p className="text-muted">
            Selecione uma categoria abaixo para ver o que cada seção do site reúne e acessar diretamente.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Explorar áreas do site por tema"
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}
        >
          {JOURNEY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTabId === tab.id}
              className="m3-chip"
              onClick={() => setActiveTabId(tab.id)}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div
          key={activeTab.id}
          role="tabpanel"
          className="m3-card m3-card--tonal m3-motion-panel"
          style={{ display: 'grid', gap: '1.5rem' }}
        >
          <div style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.35rem' }}>
            <h3>{activeTab.headline}</h3>
            <p className="text-muted">{activeTab.description}</p>
          </div>

          <div className="grid-cards">
            {activeTab.items.map((item) => (
              <div
                key={item.id}
                className="m3-card"
                style={{ display: 'grid', gap: '0.9rem', alignContent: 'space-between' }}
              >
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--camblu-action-blue)' }}>
                    <Icon name={item.icon} size={22} />
                    <strong>{item.title}</strong>
                  </div>
                  <p className="text-muted">{item.summary}</p>
                </div>

                <Link to={item.to} className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
                  <span>{item.cta}</span>
                  <Icon name="arrow_forward" size={18} className="m3-icon-shift" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Multi-browse Carousel: Tour rápido por todas as páginas */}
      <section className="page-section container" style={{ paddingBlockStart: '0.5rem', display: 'grid', gap: '1.35rem' }}>
        <div className="m3-motion-from-end" style={{ maxInlineSize: '44rem', display: 'grid', gap: '0.35rem' }}>
          <h2>Acesse qualquer canto do portal</h2>
          <p className="text-muted">
            Deslize os cartões para explorar serviços, representações estudantis, editais e canais de apoio.
          </p>
        </div>
        <M3Carousel label="Tour pelas áreas do site" variant="multi-browse" items={multiBrowseItems} />
      </section>

      {/* 6. Dúvidas? Nós temos as respostas (Acordeões finais com links diretos) */}
      <section className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem', maxInlineSize: '56rem' }}>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <h2>Dúvidas? Encontre o caminho certo</h2>
            <p className="text-muted">Respostas rápidas com acesso direto à página responsável.</p>
          </div>

          <div className="product-accordion">
            {HOME_FAQS.map((faq) => (
              <details key={faq.q} className="product-accordion-item">
                <summary>
                  <span>{faq.q}</span>
                  <Icon name="keyboard_arrow_down" size={22} className="product-accordion-chevron" />
                </summary>
                <div className="product-accordion-body">
                  <p className="text-muted">{faq.a}</p>
                  <div>
                    <Link to={faq.to} className="m3-btn m3-btn--text" style={{ paddingInlineStart: 0 }}>
                      <span>{faq.cta}</span>
                      <Icon name="arrow_forward" size={18} className="m3-icon-shift" />
                    </Link>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
