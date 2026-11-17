import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';
import { formatCpf, formatPhoneBr, isDigitsOnlyString, isValidCpf } from '../lib/validators';
import type { TShirtSize, UserAffiliation } from '../types/domain';

const TSHIRT_SIZES: TShirtSize[] = [
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'XXG',
  'Baby Look P',
  'Baby Look M',
  'Baby Look G',
];

export function ProfilePage() {
  const { profile, saveProfile, signInWithGoogle, isDemoMode } = useAuth();
  const { notify } = useToast();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [affiliation, setAffiliation] = useState<UserAffiliation>('FURB');
  const [turma, setTurma] = useState('');
  const [isCalouro, setIsCalouro] = useState(false);
  const [tshirtSize, setTshirtSize] = useState<TShirtSize>('M');
  const [cpfError, setCpfError] = useState('');
  const [turmaError, setTurmaError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setCpf(profile.cpf ? formatCpf(profile.cpf) : '');
    setPhone(profile.phone ? formatPhoneBr(profile.phone) : '');
    setAffiliation(profile.affiliation || 'FURB');
    setTurma(profile.turma || '');
    setIsCalouro(Boolean(profile.isCalouro));
    setTshirtSize(profile.tshirtSize || 'M');
  }, [profile]);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center' }}>
          <Icon name="account_circle" size={48} className="m3-badge--blue" />
          <h1 style={{ marginBlock: '0.75rem 0.5rem' }}>
            Acesse sua conta CAMBLU
          </h1>
          <p className="text-muted" style={{ marginInline: 'auto', marginBlockEnd: '1.25rem' }}>
            A autenticação no portal é feita exclusivamente com sua conta Google para manter seus ingressos,
            certificados, assinatura do Clube e pedidos sincronizados.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            onClick={() => signInWithGoogle(isDemoMode ? 'student' : undefined)}
          >
            <Icon name="login" />
            <span>Entrar com Google</span>
          </button>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpfError('');
    setTurmaError('');

    if (!isValidCpf(cpf)) {
      setCpfError('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (affiliation === 'FURB' && !isDigitsOnlyString(turma)) {
      setTurmaError('Informe o número da turma usando apenas números (ex.: 63).');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        name,
        cpf,
        phone,
        affiliation,
        turma: affiliation === 'FURB' ? turma : undefined,
        isCalouro,
        tshirtSize: isCalouro ? tshirtSize : undefined,
      });
      notify('Cadastro acadêmico atualizado com sucesso!');
    } catch {
      notify('Erro ao salvar seu perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-section container m3-reveal">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginBlockEnd: '1.5rem' }}>
        <div>
          <h1>Meu Perfil & Cadastro Acadêmico</h1>
          <p className="text-muted">
            Seus dados garantem emissão correta de certificados, transferência de ingressos via CPF e entrega na Lojinha.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/meus-ingressos" className="m3-btn m3-btn--tonal">
            <Icon name="confirmation_number" size={18} />
            <span>Meus Ingressos</span>
          </Link>
          <Link to="/certificados" className="m3-btn m3-btn--outlined">
            <Icon name="workspace_premium" size={18} />
            <span>Certificados</span>
          </Link>
        </div>
      </div>

      <div className="grid-two">
        <form onSubmit={handleSubmit} className="m3-card" style={{ display: 'grid', gap: '1rem' }} noValidate>
          <h2>Dados Pessoais & Vínculo</h2>

          <div className="m3-field">
            <label htmlFor="profile-name">Nome completo</label>
            <input
              id="profile-name"
              type="text"
              className="m3-input"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="m3-field">
            <label htmlFor="profile-email">E-mail (Google)</label>
            <input
              id="profile-email"
              type="email"
              className="m3-input"
              value={profile.email}
              readOnly
              disabled
            />
          </div>

          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="profile-cpf">CPF (usado para certificados e transferências)</label>
              <input
                id="profile-cpf"
                type="text"
                inputMode="numeric"
                className="m3-input"
                required
                aria-invalid={cpfError ? 'true' : 'false'}
                aria-describedby={cpfError ? 'profile-cpf-error' : undefined}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatCpf(e.target.value));
                  setCpfError('');
                }}
              />
              <span id="profile-cpf-error" className="m3-error-msg" data-visible={Boolean(cpfError)}>
                <Icon name="error" size={16} />
                {cpfError || 'CPF inválido.'}
              </span>
            </div>

            <div className="m3-field">
              <label htmlFor="profile-phone">Celular / WhatsApp</label>
              <input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                className="m3-input"
                required
                placeholder="(47) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
              />
            </div>
          </div>

          <fieldset
            style={{
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-md)',
              padding: '0.9rem 1rem',
              display: 'grid',
              gap: '0.75rem',
            }}
          >
            <legend className="m3-label-large" style={{ paddingInline: '0.35rem' }}>
              Vínculo Acadêmico
            </legend>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label className="m3-chip" style={{ borderColor: affiliation === 'FURB' ? 'var(--md-sys-color-primary)' : undefined }}>
                <input
                  type="radio"
                  name="affiliation"
                  value="FURB"
                  checked={affiliation === 'FURB'}
                  onChange={() => setAffiliation('FURB')}
                />
                <span>Acadêmico FURB</span>
              </label>
              <label className="m3-chip" style={{ borderColor: affiliation === 'externo' ? 'var(--md-sys-color-primary)' : undefined }}>
                <input
                  type="radio"
                  name="affiliation"
                  value="externo"
                  checked={affiliation === 'externo'}
                  onChange={() => setAffiliation('externo')}
                />
                <span>Externo (outra instituição / comunidade)</span>
              </label>
            </div>

            {affiliation === 'FURB' && (
              <div className="m3-field">
                <label htmlFor="profile-turma">Qual turma? (apenas números)</label>
                <span className="m3-field-hint">Exemplo: 63 para Turma LXIII, 62 para LXII.</span>
                <input
                  id="profile-turma"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  className="m3-input"
                  required
                  aria-invalid={turmaError ? 'true' : 'false'}
                  aria-describedby={turmaError ? 'profile-turma-error' : undefined}
                  value={turma}
                  onChange={(e) => {
                    setTurma(e.target.value.replace(/\D+/g, ''));
                    setTurmaError('');
                  }}
                />
                <span id="profile-turma-error" className="m3-error-msg" data-visible={Boolean(turmaError)}>
                  <Icon name="error" size={16} />
                  {turmaError}
                </span>
              </div>
            )}
          </fieldset>

          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 'var(--md-sys-shape-corner-md)',
              background: 'var(--md-sys-color-surface-container-low)',
              display: 'grid',
              gap: '0.75rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 650, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isCalouro}
                onChange={(e) => setIsCalouro(e.target.checked)}
              />
              <span>Sou calouro(a) nesta entrada de curso</span>
            </label>

            {isCalouro && (
              <div className="m3-field">
                <label htmlFor="profile-tshirt">Tamanho da camiseta de calouro</label>
                <select
                  id="profile-tshirt"
                  className="m3-select"
                  value={tshirtSize}
                  onChange={(e) => setTshirtSize(e.target.value as TShirtSize)}
                >
                  {TSHIRT_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="m3-btn m3-btn--filled" disabled={saving}>
            <Icon name="save" size={19} />
            <span>{saving ? 'Salvando...' : 'Salvar Cadastro'}</span>
          </button>
        </form>

        <aside style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div className="m3-card m3-card--forest">
            <span className="m3-label-small" style={{ display: 'block', marginBlockEnd: '0.35rem', color: '#f1de97' }}>
              Clube CAMBLU
            </span>
            <h2 style={{ marginBlockEnd: '0.4rem' }}>
              {profile.membershipActive
                ? `Plano ${profile.membershipTier.toUpperCase()} Ativo`
                : 'Ainda sem assinatura ativa'}
            </h2>
            <p style={{ color: '#d7ece0', marginBlockEnd: '1rem' }}>
              {profile.membershipActive
                ? `Seus descontos na Lojinha e benefícios em eventos são aplicados automaticamente.`
                : 'Assine a partir de R$ 3,50/mês para apoiar o CAMBLU e desbloquear descontos e eventos gratuitos.'}
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link to={profile.membershipActive ? '/clube/cartao' : '/clube'} className="m3-btn m3-btn--gold">
                <Icon name="badge" size={18} />
                <span>{profile.membershipActive ? 'Abrir Cartão Digital' : 'Ver Planos do Clube'}</span>
              </Link>
            </div>
          </div>

          <div className="m3-card m3-card--tonal">
            <h3 style={{ marginBlockEnd: '0.5rem' }}>
              Para que usamos cada dado?
            </h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.35rem' }} className="m3-body-medium">
              <li>
                <strong>CPF:</strong> obrigatório nos certificados de horas complementares (AACCs) e transferência de ingressos.
              </li>
              <li>
                <strong>WhatsApp:</strong> contato direto no checklist de entrega da Lojinha.
              </li>
              <li>
                <strong>Calouro + Camiseta:</strong> organização da recepção e benefício de camiseta do Clube CAMBLU.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
