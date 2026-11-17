import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/i18n';
import { Icon } from './Icon';
import { M3Dialog } from './M3Dialog';
import { useToast } from './ToastProvider';

export function AccountMenuButton() {
  const { profile, loading, isAdmin, isDemoMode, signInWithGoogle, signOut } = useAuth();
  const { t } = useI18n();
  const { notify } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (loading) {
    return (
      <span className="header-icon-btn" aria-busy="true" aria-label={t('common.loading')}>
        <Icon name="more_horiz" size={21} />
      </span>
    );
  }

  const handleLoginClick = async () => {
    if (isDemoMode) {
      setDemoDialogOpen(true);
      return;
    }
    try {
      await signInWithGoogle('student');
      notify('Login realizado com Google!');
    } catch {
      notify('Não foi possível concluir o login Google.', 'error');
    }
  };

  const handleDemoLogin = async (role: 'student' | 'admin') => {
    await signInWithGoogle(role);
    setDemoDialogOpen(false);
    notify(
      role === 'admin'
        ? 'Conectado como Gestão CAMBLU (camblufurb@gmail.com) no modo demonstração.'
        : 'Conectado como Acadêmica Demo MEDFURB.',
      'info',
    );
  };

  if (!profile) {
    return (
      <>
        <button
          type="button"
          className="header-icon-btn"
          aria-label={t('auth.signInGoogle')}
          title={t('auth.signInGoogle')}
          onClick={handleLoginClick}
        >
          <Icon name="account_circle" size={23} />
        </button>

        <M3Dialog
          open={demoDialogOpen}
          onClose={() => setDemoDialogOpen(false)}
          title="Entrar no Portal CAMBLU"
        >
          <p className="text-muted" style={{ marginBlockEnd: '1rem' }}>
            Escolha um perfil para acessar e explorar as funcionalidades do portal:
          </p>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <button
              type="button"
              className="m3-btn m3-btn--filled"
              onClick={() => handleDemoLogin('student')}
            >
              <Icon name="school" />
              <span>Entrar como Estudante (Marina · Turma 63 · Clube Raro)</span>
            </button>
            <button
              type="button"
              className="m3-btn m3-btn--gold"
              onClick={() => handleDemoLogin('admin')}
            >
              <Icon name="admin_panel_settings" />
              <span>Entrar como Gestão CAMBLU (camblufurb@gmail.com · /back)</span>
            </button>
          </div>
        </M3Dialog>
      </>
    );
  }

  const avatarInitial = profile.name.trim().charAt(0).toUpperCase() || 'C';

  return (
    <div ref={wrapRef} className="nav-dropdown">
      <button
        type="button"
        className="header-icon-btn"
        aria-label={`Conta de ${profile.name}`}
        title={profile.name}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="header-avatar-badge">
          {isAdmin ? <Icon name="verified_user" filled size={18} /> : avatarInitial}
        </span>
        {!profile.profileCompleted && (
          <span className="header-icon-dot" aria-label="Cadastro incompleto" />
        )}
      </button>

      <div className="m3-dropdown-panel" data-open={menuOpen}>
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)',
            marginBlockEnd: '0.25rem',
          }}
        >
          <strong style={{ display: 'block', fontSize: '0.92rem' }}>{profile.name}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {profile.email}
          </span>
        </div>

        <Link to="/perfil" className="dropdown-item" onClick={() => setMenuOpen(false)}>
          <Icon name="person" size={20} />
          <span>{profile.profileCompleted ? t('nav.profile') : t('auth.completeProfile')}</span>
        </Link>
        <Link to="/meus-ingressos" className="dropdown-item" onClick={() => setMenuOpen(false)}>
          <Icon name="qr_code_2" size={20} />
          <span>{t('nav.myTickets')}</span>
        </Link>
        <Link to="/meus-ingressos/historico" className="dropdown-item" onClick={() => setMenuOpen(false)}>
          <Icon name="history" size={20} />
          <span>Histórico de Ingressos</span>
        </Link>
        <Link to="/meus-pedidos" className="dropdown-item" onClick={() => setMenuOpen(false)}>
          <Icon name="receipt_long" size={20} />
          <span>Compras na Lojinha</span>
        </Link>
        <Link to="/certificados" className="dropdown-item" onClick={() => setMenuOpen(false)}>
          <Icon name="workspace_premium" size={20} />
          <span>{t('nav.certificates')}</span>
        </Link>
        <Link to="/clube/cartao" className="dropdown-item" onClick={() => setMenuOpen(false)}>
          <Icon name="badge" size={20} />
          <span>{t('nav.memberCard')}</span>
        </Link>
        {isAdmin && (
          <Link to="/back" className="dropdown-item" onClick={() => setMenuOpen(false)}>
            <Icon name="tune" size={20} />
            <span>{t('nav.admin')}</span>
          </Link>
        )}
        <button
          type="button"
          className="dropdown-item"
          onClick={async () => {
            setMenuOpen(false);
            await signOut();
            notify('Sessão encerrada.', 'info');
          }}
        >
          <Icon name="logout" size={20} />
          <span>{t('auth.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
