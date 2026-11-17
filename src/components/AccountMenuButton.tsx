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
      <span className="m3-badge" aria-busy="true">
        {t('common.loading')}
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
        <button type="button" className="m3-btn m3-btn--blue" onClick={handleLoginClick}>
          <Icon name="login" size={19} />
          <span>{t('auth.signInGoogle')}</span>
        </button>

        <M3Dialog
          open={demoDialogOpen}
          onClose={() => setDemoDialogOpen(false)}
          title="Entrar com Google (Modo Pré-Deploy)"
        >
          <p className="m3-body-medium" style={{ marginBlockEnd: '1rem' }}>
            As variáveis públicas do Web App Firebase ainda não foram vinculadas neste ambiente local. Você
            pode testar toda a plataforma agora escolhendo um perfil simulado (ou conectar o projeto{' '}
            <code>camblu</code> assim que o Web App estiver ativo):
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

  const firstName = profile.name.split(' ')[0];

  return (
    <div ref={wrapRef} className="nav-dropdown">
      <button
        type="button"
        className="m3-btn m3-btn--tonal"
        style={{ paddingInline: '0.85rem', minBlockSize: '42px' }}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Icon name={isAdmin ? 'verified_user' : 'account_circle'} filled size={20} />
        <span>{firstName}</span>
        {!profile.profileCompleted && (
          <span className="m3-badge m3-badge--gold" style={{ paddingBlock: '0.1rem' }}>
            !
          </span>
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
