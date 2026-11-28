import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/i18n';
import { logError, logInfo, logWarn } from '../lib/logger';
import { isEnrollmentRenewalNeeded } from '../lib/memberCard';
import { ClubTierWaveChip } from './ClubTierWaveChip';
import { Icon } from './Icon';
import { M3Dialog } from './M3Dialog';
import { useToast } from './ToastProvider';

export function AccountMenuButton() {
  const { profile, loading, isAdmin, isDemoMode, signInWithGoogle, signOut } = useAuth();
  const { t } = useI18n();
  const { notify } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.photoURL]);

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
      logInfo('Auth', 'Abrindo seletor de perfil no modo demonstração');
      setDemoDialogOpen(true);
      return;
    }
    logInfo('Auth', 'Iniciando fluxo de login com Google no cabeçalho');
    try {
      await signInWithGoogle('student');
      notify('Login realizado com Google!');
    } catch (err) {
      logError('Auth', 'AccountMenuButton.handleLoginClick -> signInWithGoogle', err);
      notify('Não foi possível concluir o login Google.', 'error');
    }
  };

  const handleDemoLogin = async (role: 'student' | 'admin') => {
    try {
      await signInWithGoogle(role);
      setDemoDialogOpen(false);
      notify(
        role === 'admin'
          ? 'Conectado como Gestão CAMBLU (camblufurb@gmail.com) no modo demonstração.'
          : 'Conectado como Acadêmica Demo MEDFURB.',
        'info',
      );
    } catch (err) {
      logError('Auth', 'AccountMenuButton.handleDemoLogin', err, { role });
      notify('Erro ao entrar no perfil selecionado.', 'error');
    }
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
  const showPhoto = Boolean(profile.photoURL && !avatarFailed);
  const activeClubTier =
    profile.membershipActive && profile.membershipTier && profile.membershipTier !== 'none'
      ? profile.membershipTier
      : undefined;

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
        <span className="header-avatar-ring" data-tier={activeClubTier}>
          <span className="header-avatar-badge">
            {showPhoto ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                referrerPolicy="no-referrer"
                onError={() => {
                  logWarn('Auth', 'Não foi possível carregar photoURL do usuário no cabeçalho; exibindo fallback.', {
                    uid: profile.uid,
                    photoURL: profile.photoURL,
                  });
                  setAvatarFailed(true);
                }}
              />
            ) : isAdmin ? (
              <Icon name="verified_user" filled size={18} />
            ) : (
              avatarInitial
            )}
          </span>
        </span>
        {(!profile.profileCompleted || isEnrollmentRenewalNeeded(profile)) && (
          <span
            className="header-icon-dot"
            aria-label={!profile.profileCompleted ? 'Cadastro incompleto' : 'Renovar resumo de matrícula'}
          />
        )}
      </button>

      <div className="m3-dropdown-panel" data-open={menuOpen}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.65rem 0.85rem',
            borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)',
            marginBlockEnd: '0.25rem',
          }}
        >
          <span className="header-avatar-ring header-avatar-ring--popup" data-tier={activeClubTier}>
            <span className="header-avatar-badge">
              {showPhoto ? (
                <img src={profile.photoURL} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
              ) : isAdmin ? (
                <Icon name="verified_user" filled size={18} />
              ) : (
                avatarInitial
              )}
            </span>
          </span>
          <div style={{ minInlineSize: 0, display: 'grid', gap: '0.22rem' }}>
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>{profile.name}</strong>
            <span
              style={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'var(--md-sys-color-on-surface-variant)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {profile.email}
            </span>
            {activeClubTier && <ClubTierWaveChip tier={activeClubTier} />}
          </div>
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
            try {
              await signOut();
              notify('Sessão encerrada.', 'info');
            } catch (err) {
              logError('Auth', 'AccountMenuButton.signOut', err);
              notify('Erro ao sair da sessão.', 'error');
            }
          }}
        >
          <Icon name="logout" size={20} />
          <span>{t('auth.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
