import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/i18n';
import { Icon } from './Icon';
import { CambluCrest, SponsorsStrip } from './SponsorLogos';
import { M3ShapeDefs } from './ExpressiveShapeFrame';

interface LayoutProps {
  children: React.ReactNode;
  userSlot?: React.ReactNode;
}

export function Layout({ children, userSlot }: LayoutProps) {
  const { t } = useI18n();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'academic' | 'institucional' | null>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const academicLinks = [
    { to: '/calendario', label: t('nav.calendar'), icon: 'calendar_month' },
    { to: '/editais', label: t('nav.editais'), icon: 'description' },
    { to: '/ligas', label: t('nav.ligas'), icon: 'biotech' },
    { to: '/secimed', label: t('nav.secimed'), icon: 'science' },
    { to: '/secimed/anais-secimed', label: t('nav.anais'), icon: 'menu_book' },
    { to: '/manual-do-calouro', label: t('nav.freshman'), icon: 'school' },
  ];

  const institutionalLinks = [
    { to: '/sobre', label: t('nav.about'), icon: 'apartment' },
    { to: '/medfurb', label: t('nav.medfurb'), icon: 'medical_services' },
    { to: '/medfurb/instituicoes', label: 'Instituições Estudantis', icon: 'handshake' },
    { to: '/gestoes', label: t('nav.gestoes'), icon: 'groups' },
    { to: '/transparencia', label: t('nav.transparency'), icon: 'monitoring' },
    { to: '/demandas', label: t('nav.demands'), icon: 'support_agent' },
    { to: '/camblu-mulher', label: t('nav.cambluMulher'), icon: 'shield_with_heart' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minBlockSize: '100dvh' }}>
      <M3ShapeDefs />
      <a href="#main-content" className="skip-link visually-hidden">
        {t('skip.toContent')}
      </a>

      <header className="site-header">
        <div className="container header-inner">
          <button
            type="button"
            className="m3-icon-btn mobile-menu-trigger"
            aria-label="Abrir menu de navegação"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <Link to="/" className="brand-link">
            <CambluCrest size={38} />
            <span>
              <span style={{ fontSize: '1.12rem', fontWeight: 850 }}>{t('app.title')}</span>
              <span className="brand-subtitle">{t('app.subtitle')}</span>
            </span>
          </Link>

          <nav className="primary-nav" aria-label="Navegação principal">
            <NavLink to="/" end className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/eventos" className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
              {t('nav.events')}
            </NavLink>
            <NavLink to="/lojinha" className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
              {t('nav.shop')}
            </NavLink>
            <NavLink to="/clube" className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
              {t('nav.club')}
            </NavLink>

            <div className="nav-dropdown">
              <button
                type="button"
                className="nav-pill"
                aria-expanded={openMenu === 'academic'}
                onClick={() => setOpenMenu((m) => (m === 'academic' ? null : 'academic'))}
              >
                {t('nav.academic')}
                <Icon name="expand_more" size={18} />
              </button>
              <div className="m3-dropdown-panel" data-open={openMenu === 'academic'}>
                {academicLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="dropdown-item">
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="nav-dropdown">
              <button
                type="button"
                className="nav-pill"
                aria-expanded={openMenu === 'institucional'}
                onClick={() => setOpenMenu((m) => (m === 'institucional' ? null : 'institucional'))}
              >
                {t('nav.more')}
                <Icon name="expand_more" size={18} />
              </button>
              <div className="m3-dropdown-panel" data-open={openMenu === 'institucional'}>
                {institutionalLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="dropdown-item">
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="header-actions">{userSlot}</div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className="m3-drawer-backdrop"
        data-open={drawerOpen}
        aria-hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="m3-drawer-panel"
        data-open={drawerOpen}
        aria-label="Menu lateral"
        aria-hidden={!drawerOpen}
        inert={!drawerOpen || undefined}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBlockEnd: '0.85rem',
            marginBlockEnd: '0.75rem',
            borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', fontWeight: 800 }}>
            <CambluCrest size={30} />
            CAMBLU
          </span>
          <button
            type="button"
            className="m3-icon-btn"
            aria-label="Fechar menu"
            onClick={() => setDrawerOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <nav aria-label="Links móveis" style={{ display: 'grid', gap: '0.25rem' }}>
          {[
            { to: '/', label: t('nav.home'), icon: 'home' },
            { to: '/eventos', label: t('nav.events'), icon: 'confirmation_number' },
            { to: '/lojinha', label: t('nav.shop'), icon: 'shopping_bag' },
            { to: '/clube', label: t('nav.club'), icon: 'workspace_premium' },
            ...academicLinks,
            ...institutionalLinks,
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `dropdown-item ${isActive ? 'is-active' : ''}`}
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)',
                    }
                  : undefined
              }
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container" style={{ paddingBlock: '2.5rem', display: 'grid', gap: '1.75rem' }}>
          <SponsorsStrip variant="dark" compact />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBlockEnd: '0.6rem' }}>
                <CambluCrest size={42} variant="clean" />
                <div>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: '#ffffff' }}>CAMBLU — FURB</strong>
                  <span style={{ fontSize: '0.8rem', color: '#c4d8cc' }}>
                    Centro Acadêmico de Medicina de Blumenau
                  </span>
                </div>
              </div>
              <p style={{ color: '#c4d8cc' }}>
                Fundado em 1990. Entidade sem fins lucrativos e apartidária dedicada aos acadêmicos de Medicina da
                FURB.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#edd16e', marginBlockEnd: '0.6rem' }}>
                Navegação Rápida
              </h3>
              <ul style={{ display: 'grid', gap: '0.35rem', padding: 0, listStyle: 'none', fontSize: '0.88rem' }}>
                <li><Link to="/eventos">Eventos e Ingressos</Link></li>
                <li><Link to="/clube">Clube CAMBLU</Link></li>
                <li><Link to="/lojinha">Lojinha</Link></li>
                <li><Link to="/transparencia">Transparência e Atas</Link></li>
                <li><Link to="/manual-do-calouro">Manual do Calouro</Link></li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: '#edd16e', marginBlockEnd: '0.6rem' }}>
                Institucional & Apoio
              </h3>
              <ul style={{ display: 'grid', gap: '0.35rem', padding: 0, listStyle: 'none', fontSize: '0.88rem' }}>
                <li><Link to="/secimed/anais-secimed">Anais SECIMED (ISSN 3086-612X)</Link></li>
                <li><Link to="/editais">Editais (E-PAF, E-PAATC, E-PAFLIEC)</Link></li>
                <li><Link to="/demandas">Enviar Demanda / Ajuda</Link></li>
                <li><Link to="/camblu-mulher">CAMBLU Mulher</Link></li>
                <li>
                  <a href="mailto:camblufurb@gmail.com">camblufurb@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '0.75rem',
              paddingBlockStart: '1rem',
              borderBlockStart: '1px solid rgb(255 255 255 / 0.12)',
              fontSize: '0.82rem',
              color: '#a8bfb2',
            }}
          >
            <span>© {new Date().getFullYear()} Centro Acadêmico de Medicina de Blumenau (CAMBLU — FURB)</span>
            <span>Blumenau, Santa Catarina · Licença MIT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
