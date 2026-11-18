import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { Icon } from '../components/Icon';
import { M3Dialog } from '../components/M3Dialog';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, isFirebaseConfigured } from '../lib/firebase';
import { logError, logInfo, logWarn } from '../lib/logger';
import {
  buildMemberCardVerificationFromProfile,
  getMemberCardAppearance,
  type MemberCardVerificationResult,
} from '../lib/memberCard';
import { formatCpf } from '../lib/validators';

function extractUidFromInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/clube\/cartao\/validar\/([^/?#]+)/i);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).trim();
    } catch {
      return match[1].trim();
    }
  }
  return trimmed;
}

export function MemberCardValidationPage() {
  const { uid: routeUid } = useParams<{ uid?: string }>();
  const navigate = useNavigate();
  const { profile, allDemoUsers, isDemoMode } = useAuth();

  const normalizedRouteUid = routeUid ? routeUid.trim() : '';
  const [searchInput, setSearchInput] = useState(normalizedRouteUid);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<MemberCardVerificationResult | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  useEffect(() => {
    setSearchInput(normalizedRouteUid);
    setPdfModalOpen(false);
  }, [normalizedRouteUid]);

  const verifyUid = useCallback(
    async (targetUid: string) => {
      const cleanUid = targetUid.trim();
      if (!cleanUid) {
        setResult(null);
        setErrorMsg(null);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      setPhotoError(false);

      if (isDemoMode || !isFirebaseConfigured) {
        const candidates = [profile, ...allDemoUsers].filter(Boolean);
        const match = candidates.find((candidate) => candidate?.uid === cleanUid) ?? null;
        logInfo('Carteirinha', 'Validação local em modo demonstração', {
          uid: cleanUid,
          found: Boolean(match),
        });
        setResult(buildMemberCardVerificationFromProfile(match));
        setLoading(false);
        return;
      }

      try {
        logInfo('Carteirinha', 'Consultando autenticidade da carteirinha via /api/clube/cartao/verify', {
          uid: cleanUid,
        });
        const res = await fetch(
          `${API_BASE_URL}/clube/cartao/verify?uid=${encodeURIComponent(cleanUid)}`,
          { cache: 'no-store' },
        );
        const contentType = res.headers.get('content-type') || '';
        const isJsonResponse = contentType.includes('application/json');
        const data = isJsonResponse
          ? ((await res.json().catch(() => null)) as
              | MemberCardVerificationResult
              | { error?: string }
              | null)
          : null;

        const isLocalhostHost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (!isJsonResponse && isLocalhostHost && profile && profile.uid === cleanUid) {
          logWarn('Carteirinha', 'API local indisponível no Vite preview; validando com perfil da sessão em localhost', {
            origin: 'MemberCardValidationPage -> localhost preview fallback',
            uid: cleanUid,
            status: res.status,
          });
          setResult(buildMemberCardVerificationFromProfile(profile));
          return;
        }

        if (!res.ok && res.status !== 404) {
          const serverError =
            (data && 'error' in data && typeof data.error === 'string' && data.error) ||
            `Falha HTTP ${res.status} ao validar carteirinha.`;
          throw new Error(serverError);
        }

        if (!data || !('found' in data)) {
          throw new Error('Resposta inesperada do servidor ao validar carteirinha.');
        }

        logInfo('Carteirinha', 'Resultado da validação recebido', {
          uid: cleanUid,
          found: data.found,
          valid: data.valid,
          active: data.active,
          tierCode: data.tierCode,
        });
        setResult(data);
      } catch (err) {
        const isLocalhostHost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalhostHost && profile && profile.uid === cleanUid) {
          logWarn('Carteirinha', 'Falha de rede na API em localhost; usando perfil da sessão ativa apenas localmente', {
            origin: 'MemberCardValidationPage -> localhost network fallback',
            uid: cleanUid,
            err,
          });
          setResult(buildMemberCardVerificationFromProfile(profile));
          return;
        }
        logError('Carteirinha', 'MemberCardValidationPage -> GET /api/clube/cartao/verify', err, {
          uid: cleanUid,
        });
        setResult(null);
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Não foi possível validar a autenticidade da carteirinha no momento.',
        );
      } finally {
        setLoading(false);
      }
    },
    [allDemoUsers, isDemoMode, profile],
  );

  useEffect(() => {
    verifyUid(normalizedRouteUid);
  }, [normalizedRouteUid, verifyUid]);

  const handleLookupSubmit = (e: FormEvent) => {
    e.preventDefault();
    const extracted = extractUidFromInput(searchInput);
    if (!extracted) return;
    if (extracted === normalizedRouteUid) {
      verifyUid(extracted);
      return;
    }
    navigate(`/clube/cartao/validar/${encodeURIComponent(extracted)}`);
  };

  const appearance = result?.active
    ? getMemberCardAppearance(result.tier, result.active)
    : undefined;
  const avatarInitial = result?.name?.trim().charAt(0).toUpperCase() || 'C';
  const isFurbValidStudentCard = Boolean(result?.found && result.active && result.valid);
  const safeEnrollmentPdfUrl =
    result?.enrollmentSummaryUrl &&
    (/^https:\/\/firebasestorage\.googleapis\.com\//i.test(result.enrollmentSummaryUrl) ||
      (isDemoMode && /^data:application\/pdf;base64,/i.test(result.enrollmentSummaryUrl)))
      ? result.enrollmentSummaryUrl
      : undefined;

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="m3-card page-hero-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <span className="m3-badge m3-badge--blue">
            <Icon name="badge" size={16} />
            Validação Pública · Carteirinha de Estudante CAMBLU
          </span>
          <Link to="/clube/cartao" className="m3-btn m3-btn--text" style={{ minBlockSize: '36px' }}>
            <Icon name="arrow_back" size={18} />
            <span>Minha Carteirinha</span>
          </Link>
        </div>

        <AnimatedClimateTitle tone="primary" accessibleHeading="Validação Pública da Carteirinha de Estudante CAMBLU">
          AUTENTICIDADE
        </AnimatedClimateTitle>

        <p className="page-hero-desc page-hero-desc--on-light" style={{ margin: 0 }}>
          Confira em tempo real se a Carteirinha de Estudante CAMBLU (Medicina FURB) está ativa e vinculada a um(a)
          acadêmico(a) regularmente inscrito(a) no Clube CAMBLU a partir do Plano Comum.
        </p>

        <form onSubmit={handleLookupSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <input
            type="text"
            className="m3-input"
            style={{ flex: '1 1 16rem' }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Código da carteirinha ou link completo do QR Code"
            aria-label="Código identificador da carteirinha"
          />
          <button type="submit" className="m3-btn m3-btn--blue" disabled={loading || !searchInput.trim()}>
            <Icon name="verified_user" size={18} />
            <span>{loading ? 'Validando...' : 'Validar Carteirinha'}</span>
          </button>
        </form>
      </div>

      {loading && (
        <article className="m3-card" aria-busy="true" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span className="m3-badge m3-badge--blue" aria-hidden="true">
            <Icon name="sync" size={18} />
          </span>
          <span>Consultando autenticidade em tempo real nos servidores do CAMBLU...</span>
        </article>
      )}

      {!loading && errorMsg && (
        <article className="m3-card" role="alert" style={{ display: 'grid', gap: '0.75rem' }}>
          <span className="m3-badge m3-badge--error" style={{ justifySelf: 'start' }}>
            <Icon name="error" size={17} />
            Erro na Consulta
          </span>
          <p style={{ margin: 0 }}>{errorMsg}</p>
          <div>
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              onClick={() => verifyUid(normalizedRouteUid)}
            >
              <Icon name="refresh" size={18} />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </article>
      )}

      {!loading && !errorMsg && result && !result.found && (
        <article className="m3-card" style={{ display: 'grid', gap: '0.75rem' }}>
          <span className="m3-badge m3-badge--error" style={{ justifySelf: 'start' }}>
            <Icon name="gpp_bad" size={17} />
            Carteirinha Não Localizada
          </span>
          <p className="text-muted" style={{ margin: 0 }}>
            {result.reason || 'Nenhuma carteirinha foi encontrada para o identificador informado.'}
          </p>
        </article>
      )}

      {!loading && !errorMsg && result?.found && !result.active && (
        <article className="m3-card member-verify-card member-verify-card--inactive" style={{ display: 'grid', gap: '1rem' }}>
          <header className="member-verify-card__header">
            <span className="m3-badge m3-badge--error">
              <Icon name="gpp_bad" size={17} />
              Carteirinha Inativa / Inválida
            </span>
            <span className="m3-badge">Plano: {result.tierName} (Código {result.tierCode})</span>
          </header>

          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {result.reason ||
              'Esta assinatura do Clube CAMBLU não está ativa ou encontra-se expirada. A Carteirinha de Estudante válida exige assinatura ativa a partir do Plano Comum.'}
          </p>

          <footer className="member-verify-card__footer">
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Verificado em {new Date(result.verifiedAt).toLocaleString('pt-BR')} · ID: {result.uid}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                onClick={() => verifyUid(result.uid)}
              >
                <Icon name="refresh" size={18} />
                <span>Revalidar</span>
              </button>
              <Link to="/clube" className="m3-btn m3-btn--blue">
                <Icon name="workspace_premium" size={18} />
                <span>Assinar a partir do Plano Comum</span>
              </Link>
            </div>
          </footer>
        </article>
      )}

      {!loading && !errorMsg && result?.found && result.active && (
        <article className="m3-card member-verify-card">
          <header className="member-verify-card__header">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
              {isFurbValidStudentCard ? (
                <span className="m3-badge m3-badge--success">
                  <Icon name="verified" filled size={17} />
                  Carteirinha de Estudante Autêntica e Válida
                </span>
              ) : (
                <span className="m3-badge m3-badge--gold">
                  <Icon name="badge" size={17} />
                  Cartão de membro externo · Clube CAMBLU
                </span>
              )}

              {isFurbValidStudentCard && safeEnrollmentPdfUrl ? (
                <button
                  type="button"
                  className="m3-btn m3-btn--filled"
                  style={{ minBlockSize: '34px', paddingBlock: '0.35rem', paddingInline: '0.85rem' }}
                  onClick={() => setPdfModalOpen(true)}
                >
                  <Icon name="verified" variant="outlined" size={18} />
                  <span>Matrícula verificada</span>
                </button>
              ) : null}
            </div>

            <span
              className="m3-badge"
              style={
                appearance
                  ? { background: appearance.background, color: appearance.foreground }
                  : undefined
              }
            >
              Clube {result.tierName} · Nível {result.tierCode}
            </span>
          </header>

          <div className="member-verify-card__body">
            {result.photoURL && !photoError ? (
              <img
                className="member-verify-card__photo"
                src={result.photoURL}
                alt={`Foto de identificação de ${result.name || 'estudante'}`}
                referrerPolicy="no-referrer"
                onError={() => {
                  logWarn('Carteirinha', 'Falha ao carregar foto na página de validação; usando inicial', {
                    uid: result.uid,
                    photoURL: result.photoURL,
                  });
                  setPhotoError(true);
                }}
              />
            ) : (
              <div className="member-verify-card__photo member-verify-card__photo--fallback" aria-label={`Inicial de ${result.name || 'estudante'}`}>
                <span>{avatarInitial}</span>
              </div>
            )}

            <dl className="member-verify-card__facts">
              <div>
                <dt>Nome completo</dt>
                <dd>{result.name || 'Não informado'}</dd>
              </div>
              <div>
                <dt>CPF</dt>
                <dd>{result.cpf ? formatCpf(result.cpf) : 'Não informado'}</dd>
              </div>
              <div>
                <dt>Instituição</dt>
                <dd>{result.affiliation === 'FURB' ? 'FURB — Universidade Regional de Blumenau' : result.institution}</dd>
              </div>
              <div>
                <dt>Curso</dt>
                <dd>{result.course}</dd>
              </div>
              <div>
                <dt>Turma</dt>
                <dd>
                  {result.affiliation === 'FURB'
                    ? result.turma
                      ? `Turma ${result.turma}`
                      : 'Não informada'
                    : 'Não aplicável'}
                </dd>
              </div>
              <div>
                <dt>Validade do passe</dt>
                <dd>
                  {result.validUntil
                    ? `Válida até ${new Date(result.validUntil).toLocaleDateString('pt-BR')}`
                    : `Plano ${result.tierName} ativo`}
                </dd>
              </div>
            </dl>
          </div>

          {!isFurbValidStudentCard && result.reason && (
            <p
              style={{
                margin: 0,
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--md-sys-shape-corner-md)',
                background: 'var(--md-sys-color-surface-container-high)',
                fontSize: '0.9rem',
              }}
            >
              {result.reason}
            </p>
          )}

          <footer className="member-verify-card__footer">
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Consulta autenticada em {new Date(result.verifiedAt).toLocaleString('pt-BR')} · Código: {result.uid}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <button
                type="button"
                className="m3-btn m3-btn--blue"
                onClick={() => verifyUid(result.uid)}
              >
                <Icon name="refresh" size={18} />
                <span>Revalidar Autenticidade</span>
              </button>
              <Link to="/clube" className="m3-btn m3-btn--outlined">
                <Icon name="workspace_premium" size={18} />
                <span>Sobre o Clube CAMBLU</span>
              </Link>
            </div>
          </footer>
        </article>
      )}

      {isFurbValidStudentCard && safeEnrollmentPdfUrl ? (
        <M3Dialog
          wide
          open={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          title="Matrícula verificada — Resumo de Matrícula (FURB)"
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <iframe
              src={safeEnrollmentPdfUrl}
              title={`Resumo de matrícula de ${result?.name || 'estudante'}`}
              className="member-verify-pdf-frame"
              referrerPolicy="no-referrer"
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <a
                href={safeEnrollmentPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="m3-btn m3-btn--blue"
              >
                <Icon name="open_in_new" size={18} />
                <span>Abrir PDF em nova aba</span>
              </a>
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                onClick={() => setPdfModalOpen(false)}
              >
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </M3Dialog>
      ) : null}
    </section>
  );
}
