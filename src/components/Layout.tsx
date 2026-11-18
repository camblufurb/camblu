import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useShopCart } from '../context/ShopCartContext';
import { useI18n } from '../i18n/i18n';
import { Icon } from './Icon';
import { PortalSearchDialog } from './PortalSearchDialog';
import { ShopCartDialog } from './ShopCartDialog';
import { CambluCrest, SponsorsStrip } from './SponsorLogos';
import { M3ShapeDefs } from './ExpressiveShapeFrame';
import goritIconUrl from '../../assets/icons/gorit.svg';
import spaiqIconUrl from '../../assets/icons/spaiq.svg';

interface LayoutProps {
  children: React.ReactNode;
  userSlot?: React.ReactNode;
}

export function Layout({ children, userSlot }: LayoutProps) {
  const { t } = useI18n();
  const { totalItemsCount, setCartOpen } = useShopCart();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > 12 : false,
  );
  const [openMenu, setOpenMenu] = useState<'academic' | 'institucional' | 'apps' | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setOpenMenu(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    const onDocClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onDocClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDocClick);
    };
  }, []);

  const academicLinks = [
    { to: '/calendario', label: t('nav.calendar'), icon: 'calendar_month' },
    { to: '/editais', label: t('nav.editais'), icon: 'description' },
    { to: '/ligas', label: t('nav.ligas'), icon: 'biotech' },
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

  const appLinks = [
    { href: 'https://flashcards.camblu.org/', label: 'Spaiq — Flashcard', iconSrc: spaiqIconUrl },
    { href: 'https://gorit.camblu.org/', label: 'Gorit — Planner', iconSrc: goritIconUrl },
  ];

  const renderAppLinks = (onSelect: () => void) =>
    appLinks.map((item) => (
      <a
        key={item.href}
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="dropdown-item"
        onClick={onSelect}
      >
        <img
          src={item.iconSrc}
          alt=""
          aria-hidden="true"
          width={22}
          height={22}
          style={{ inlineSize: '22px', blockSize: '22px', objectFit: 'contain', flexShrink: 0 }}
        />
        <span>{item.label}</span>
        <span style={{ marginInlineStart: 'auto', opacity: 0.72, display: 'inline-flex' }}>
          <Icon name="open_in_new" size={16} />
        </span>
      </a>
    ));

  const isAcademicActive = academicLinks.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  );
  const isInstitutionalActive = institutionalLinks.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minBlockSize: '100dvh', position: 'relative' }}>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetBlockStart: 0,
          insetInlineStart: 0,
          inlineSize: '1px',
          blockSize: '12px',
          pointerEvents: 'none',
        }}
      />
      <M3ShapeDefs />
      <a href="#main-content" className="skip-link visually-hidden">
        {t('skip.toContent')}
      </a>

      <header className="site-header" data-scrolled={scrolled ? 'true' : 'false'}>
        <div className="header-shell">
          <div className="header-inner">
            <button
              type="button"
              className="header-icon-btn mobile-menu-trigger"
              aria-label="Abrir menu de navegação"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="menu" size={22} />
            </button>

            <Link to="/" className="brand-link" aria-label="CAMBLU — Página inicial" title="CAMBLU">
              <CambluCrest size={36} />
            </Link>

            <nav ref={navRef} className="primary-nav" aria-label="Navegação principal">
              <NavLink to="/" end className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/secimed" end className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
                {t('nav.secimed')}
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
                  className={`nav-pill ${isAcademicActive ? 'is-active' : ''}`}
                  aria-expanded={openMenu === 'academic'}
                  onClick={() => setOpenMenu((m) => (m === 'academic' ? null : 'academic'))}
                >
                  <span>{t('nav.academic')}</span>
                  <Icon name="expand_more" size={18} className="nav-chevron" />
                </button>
                <div className="m3-dropdown-panel" data-open={openMenu === 'academic'}>
                  {academicLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="dropdown-item"
                      onClick={() => setOpenMenu(null)}
                    >
                      <Icon name={item.icon} size={20} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="nav-dropdown">
                <button
                  type="button"
                  className={`nav-pill ${isInstitutionalActive ? 'is-active' : ''}`}
                  aria-expanded={openMenu === 'institucional'}
                  onClick={() => setOpenMenu((m) => (m === 'institucional' ? null : 'institucional'))}
                >
                  <span>{t('nav.more')}</span>
                  <Icon name="expand_more" size={18} className="nav-chevron" />
                </button>
                <div className="m3-dropdown-panel" data-open={openMenu === 'institucional'}>
                  {institutionalLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="dropdown-item"
                      onClick={() => setOpenMenu(null)}
                    >
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
                  aria-expanded={openMenu === 'apps'}
                  onClick={() => setOpenMenu((m) => (m === 'apps' ? null : 'apps'))}
                >
                  <span>{t('nav.apps')}</span>
                  <Icon name="expand_more" size={18} className="nav-chevron" />
                </button>
                <div className="m3-dropdown-panel" data-open={openMenu === 'apps'}>
                  {renderAppLinks(() => setOpenMenu(null))}
                </div>
              </div>
            </nav>

            <div className="header-actions">
              <button
                type="button"
                className="header-icon-btn"
                aria-label="Pesquisar no portal"
                title="Pesquisar (Ctrl + K)"
                onClick={() => setSearchOpen(true)}
              >
                <Icon name="search" size={22} />
              </button>

              {(totalItemsCount > 0 || location.pathname.startsWith('/lojinha')) && (
                <button
                  type="button"
                  className="header-icon-btn"
                  aria-label={
                    totalItemsCount > 0 ? `Abrir sacola (${totalItemsCount} itens)` : 'Abrir sacola da Lojinha'
                  }
                  title="Sacola da Lojinha"
                  onClick={() => setCartOpen(true)}
                >
                  <Icon name="shopping_cart" size={22} />
                  {totalItemsCount > 0 && <span className="header-cart-badge">{totalItemsCount}</span>}
                </button>
              )}

              {userSlot}
            </div>
          </div>
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
            { to: '/secimed', label: t('nav.secimed'), icon: 'science' },
            { to: '/eventos', label: t('nav.events'), icon: 'confirmation_number' },
            { to: '/lojinha', label: t('nav.shop'), icon: 'shopping_bag' },
            { to: '/clube', label: t('nav.club'), icon: 'workspace_premium' },
            ...academicLinks,
            ...institutionalLinks,
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/secimed'}
              className={({ isActive }) => `dropdown-item ${isActive ? 'is-active' : ''}`}
              onClick={() => setDrawerOpen(false)}
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
          <div
            style={{
              borderBlockStart: '1px solid var(--md-sys-color-outline-variant)',
              marginBlockStart: '0.4rem',
              paddingBlockStart: '0.55rem',
              display: 'grid',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                paddingInline: '0.85rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {t('nav.apps')}
            </span>
            {renderAppLinks(() => setDrawerOpen(false))}
          </div>
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
                <li><Link to="/privacidade">Política de Privacidade</Link></li>
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
            <span>
              Blumenau, Santa Catarina · Licença MIT ·{' '}
              <Link to="/privacidade" style={{ color: '#d7ebe0' }}>
                Política de Privacidade
              </Link>
            </span>
          </div>
        </div>
      </footer>

      <ShopCartDialog />
      <PortalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
