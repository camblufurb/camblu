import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';
import { AdminEventsTab } from '../components/admin/AdminEventsTab';
import { AdminShopTab } from '../components/admin/AdminShopTab';
import { AdminTransparencyTab } from '../components/admin/AdminTransparencyTab';
import { AdminInstitutionalTab } from '../components/admin/AdminInstitutionalTab';
import { ADMIN_EMAIL } from '../lib/firebase';

type BackTab = 'eventos' | 'lojinha' | 'transparencia' | 'institucional';

export function AdminBackPage() {
  const { profile, isAdmin, isDemoMode, signInWithGoogle } = useAuth();
  const { resetDemoData, events, orders, tickets, ligas } = useAppData();
  const { notify } = useToast();
  const [tab, setTab] = useState<BackTab>('eventos');

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '38rem', marginInline: 'auto', textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <Icon name="admin_panel_settings" size={48} className="m3-badge--blue" />
          <h1>Painel Administrativo (/back)</h1>
          <p className="m3-body-medium">
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
          <h1 className="m3-headline-medium" style={{ marginBlock: '0.6rem 0.4rem' }}>
            Acesso Restrito à Diretoria
          </h1>
          <p className="m3-body-medium">
            Você está conectado como <strong>{profile.email}</strong>. Apenas <strong>{ADMIN_EMAIL}</strong> pode
            editar eventos, ler QR codes, gerenciar estoque e visualizar o saldo financeiro no painel <code>/back</code>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.5rem' }}>
            <Icon name="verified_user" size={15} />
            Admin autenticado: {profile.email}
          </span>
          <h1>Painel de Gestão CAMBLU (/back)</h1>
          <p style={{ color: '#dceddf' }}>
            {events.length} eventos · {tickets.length} ingressos emitidos · {orders.length} pedidos na Lojinha ·{' '}
            {ligas.length} ligas
          </p>
        </div>

        {isDemoMode && (
          <button
            type="button"
            className="m3-btn m3-btn--outlined"
            style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.35)' }}
            onClick={() => {
              resetDemoData();
              notify('Dados locais restaurados para o seed inicial.', 'info');
            }}
          >
            <Icon name="restart_alt" size={18} />
            <span>Restaurar Seed Demo</span>
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Áreas do painel administrativo" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {[
          { id: 'eventos', label: 'Eventos, Scanner QR & Certificados', icon: 'qr_code_scanner' },
          { id: 'lojinha', label: 'Lojinha, Doações & Entregas', icon: 'shopping_bag' },
          { id: 'transparencia', label: 'Transparência, Saldo & 4 Posts IG', icon: 'account_balance_wallet' },
          { id: 'institucional', label: 'Gestões (1:1), Editais, Anais & Ligas', icon: 'edit_note' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`m3-btn ${tab === item.id ? 'm3-btn--filled' : 'm3-btn--outlined'}`}
            onClick={() => setTab(item.id as BackTab)}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'eventos' && <AdminEventsTab />}
      {tab === 'lojinha' && <AdminShopTab />}
      {tab === 'transparencia' && <AdminTransparencyTab />}
      {tab === 'institucional' && <AdminInstitutionalTab />}
    </section>
  );
}
