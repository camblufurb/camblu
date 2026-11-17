import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_EMAIL } from '../../lib/firebase';
import { Icon } from '../Icon';
import { useToast } from '../ToastProvider';

interface Crumb {
  label: string;
  to: string;
}

const ROUTE_LABELS: Record<string, string> = {
  back: 'Dashboard',
  lojinha: 'Lojinha',
  estoque: 'Controle de Estoque',
  produtos: 'Produtos',
  entregas: 'Entregas',
  historico: 'Histórico de Compras',
  clube: 'Clube CAMBLU',
  eventos: 'Eventos',
  novo: 'Novo Evento',
  lotes: 'Lotes',
  participantes: 'Participantes',
  certificados: 'Certificados',
  qr: 'Ler QR Code',
  transparencia: 'Financeiro & Transparência',
  posts: 'Posts Mensais IG',
  gestoes: 'Gestões',
  editais: 'Editais',
  anais: 'Anais SECIMED',
  ligas: 'Ligas Acadêmicas',
  demandas: 'Demandas & Ouvidoria',
};

export function AdminShell() {
  const { profile, isAdmin, isDemoMode, signInWithGoogle } = useAuth();
  const { resetDemoData, events, orders, products } = useAppData();
  const { notify } = useToast();
  const location = useLocation();
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    setRailOpen(false);
  }, [location.pathname]);

  const breadcrumbs = useMemo<Crumb[]>(() => {
    const cleanPath = location.pathname.replace(/\/+$/, '');
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      return [{ label: 'Dashboard (/back)', to: '/back' }];
    }

    const trail: Crumb[] = [{ label: 'Dashboard', to: '/back' }];
    let acc = '/back';
    for (let i = 1; i < parts.length; i += 1) {
      const seg = parts[i];
      acc += `/${seg}`;
      if (parts[i - 1] === 'eventos' && seg !== 'novo') {
        const matchedEvent = events.find((ev) => ev.id === seg || ev.slug === seg);
        trail.push({ label: matchedEvent?.title || seg, to: acc });
      } else {
        trail.push({ label: ROUTE_LABELS[seg] || seg, to: acc });
      }
    }
    return trail;
  }, [location.pathname, events]);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div
          className="m3-card"
          style={{ maxInlineSize: '38rem', marginInline: 'auto', textAlign: 'center', display: 'grid', gap: '1rem' }}
        >
          <Icon name="admin_panel_settings" size={48} className="m3-badge--blue" />
          <h1>Painel Administrativo (/back)</h1>
          <p className="text-muted">
            Acesso restrito exclusivamente à conta Google oficial <strong>{ADMIN_EMAIL}</strong>.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--gold"
            onClick={() => signInWithGoogle(isDemoMode ? 'admin' : undefined)}
          >
            <Icon name="login" size={18} />
            <span>{isDemoMode ? `Entrar como ${ADMIN_EMAIL} (Demo)` : 'Entrar com conta Google CAMBLU'}</span>
          </button>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card m3-card--tonal" style={{ maxInlineSize: '38rem', marginInline: 'auto', textAlign: 'center' }}>
          <Icon name="gpp_bad" size={44} className="m3-badge--error" />
          <h1 style={{ marginBlock: '0.6rem 0.4rem' }}>Acesso Restrito à Diretoria</h1>
          <p className="text-muted">
            Você está conectado como <strong>{profile.email}</strong>. Apenas <strong>{ADMIN_EMAIL}</strong> pode
            acessar os módulos do painel <code>/back</code>.
          </p>
        </div>
      </section>
    );
  }

  const pendingOrdersCount = orders.filter((o) => !o.delivered).length;
  const lowStockCount = products.reduce(
    (acc, p) => acc + p.sizes.filter((s) => p.active && s.stock <= 5).length,
    0,
  );

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.35rem' }}>
      <div
        className="m3-card m3-card--forest"
        style={{
          padding: '1.15rem 1.35rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 680, color: '#edd16e', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Icon name="verified_user" size={16} />
            Painel de Gestão · {profile.email}
          </span>
          <strong style={{ fontSize: '1.25rem', color: '#ffffff' }}>Administração CAMBLU (/back)</strong>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          <Link to="/lojinha" className="m3-btn m3-btn--outlined" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.32)', minBlockSize: '40px' }}>
            <Icon name="open_in_new" size={17} />
            <span>Ver Portal</span>
          </Link>
          {isDemoMode && (
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.32)', minBlockSize: '40px' }}
              onClick={() => {
                resetDemoData();
                notify('Dados locais restaurados para o seed inicial.', 'info');
              }}
            >
              <Icon name="restart_alt" size={17} />
              <span>Restaurar Seed Demo</span>
            </button>
          )}
        </div>
      </div>

      <div className="admin-mobile-bar">
        <button
          type="button"
          className="m3-btn m3-btn--outlined"
          aria-expanded={railOpen}
          aria-controls="admin-side-rail"
          onClick={() => setRailOpen((prev) => !prev)}
          style={{ inlineSize: '100%', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="menu" size={19} />
            <span>{railOpen ? 'Ocultar Menu do Painel' : 'Menu do Painel (/back)'}</span>
          </span>
          <Icon name={railOpen ? 'expand_less' : 'expand_more'} size={20} />
        </button>
      </div>

      <div className="admin-shell-layout">
        <aside id="admin-side-rail" className="admin-rail" data-open={railOpen ? 'true' : 'false'} aria-label="Navegação do painel administrativo">
          <div className="admin-rail-group">
            <span className="admin-rail-heading">Visão Geral</span>
            <NavLink to="/back" end className="admin-rail-link">
              <Icon name="analytics" size={19} />
              <span>Dashboard</span>
            </NavLink>
          </div>

          <div className="admin-rail-group">
            <span className="admin-rail-heading">Lojinha</span>
            <NavLink to="/back/lojinha" end className="admin-rail-link">
              <Icon name="storefront" size={19} />
              <span>Visão da Lojinha</span>
            </NavLink>
            <NavLink to="/back/lojinha/estoque" className="admin-rail-link admin-rail-link--sub">
              <Icon name="inventory_2" size={18} />
              <span>Estoque{lowStockCount > 0 ? ` (${lowStockCount} baixos)` : ''}</span>
            </NavLink>
            <NavLink to="/back/lojinha/produtos" className="admin-rail-link admin-rail-link--sub">
              <Icon name="shopping_bag" size={18} />
              <span>Produtos ({products.length})</span>
            </NavLink>
            <NavLink to="/back/lojinha/entregas" className="admin-rail-link admin-rail-link--sub">
              <Icon name="local_shipping" size={18} />
              <span>Entregas{pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ''}</span>
            </NavLink>
            <NavLink to="/back/lojinha/historico" className="admin-rail-link admin-rail-link--sub">
              <Icon name="receipt_long" size={18} />
              <span>Histórico de Compras</span>
            </NavLink>
          </div>

          <div className="admin-rail-group">
            <span className="admin-rail-heading">Clube CAMBLU</span>
            <NavLink to="/back/clube" className="admin-rail-link">
              <Icon name="workspace_premium" size={19} />
              <span>Clube & Sócios</span>
            </NavLink>
          </div>

          <div className="admin-rail-group">
            <span className="admin-rail-heading">Eventos</span>
            <NavLink to="/back/eventos" end className="admin-rail-link">
              <Icon name="event" size={19} />
              <span>Todos os Eventos ({events.length})</span>
            </NavLink>
            <NavLink to="/back/eventos/novo" className="admin-rail-link admin-rail-link--sub">
              <Icon name="add_circle" size={18} />
              <span>Novo Evento</span>
            </NavLink>
            <NavLink to="/back/eventos/historico" className="admin-rail-link admin-rail-link--sub">
              <Icon name="history" size={18} />
              <span>Histórico de Ingressos</span>
            </NavLink>
            <NavLink to="/back/qr" className="admin-rail-link">
              <Icon name="qr_code_scanner" size={19} />
              <span>Leitor de QR code</span>
            </NavLink>
          </div>

          <div className="admin-rail-group">
            <span className="admin-rail-heading">Finanças & Conteúdo</span>
            <NavLink to="/back/transparencia" end className="admin-rail-link">
              <Icon name="account_balance_wallet" size={19} />
              <span>Financeiro & Atas</span>
            </NavLink>
            <NavLink to="/back/transparencia/posts" className="admin-rail-link admin-rail-link--sub">
              <Icon name="auto_awesome" size={18} />
              <span>Posts Mensais IG</span>
            </NavLink>
            <NavLink to="/back/gestoes" className="admin-rail-link">
              <Icon name="groups" size={19} />
              <span>Gestões</span>
            </NavLink>
            <NavLink to="/back/editais" className="admin-rail-link">
              <Icon name="description" size={19} />
              <span>Editais</span>
            </NavLink>
            <NavLink to="/back/anais" className="admin-rail-link">
              <Icon name="menu_book" size={19} />
              <span>Anais SECIMED</span>
            </NavLink>
            <NavLink to="/back/ligas" className="admin-rail-link">
              <Icon name="biotech" size={19} />
              <span>Ligas Acadêmicas</span>
            </NavLink>
            <NavLink to="/back/demandas" className="admin-rail-link">
              <Icon name="support_agent" size={19} />
              <span>Demandas</span>
            </NavLink>
          </div>
        </aside>

        <div className="admin-content-col">
          <nav aria-label="Breadcrumbs" className="admin-breadcrumb">
            <ol>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={crumb.to}>
                    <Link to={crumb.to} aria-current={isLast ? 'page' : undefined}>
                      {crumb.label}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <Outlet />
        </div>
      </div>
    </section>
  );
}
