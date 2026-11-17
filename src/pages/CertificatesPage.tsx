import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';
import {
  exportCertificatePdf,
  exportCertificatePng,
  renderCertificateToCanvas,
  triggerBlobDownload,
} from '../lib/certificateRenderer';
import { digitsOnly, formatCpf } from '../lib/validators';
import type { CertificateRecord, CertificateTemplateConfig } from '../types/domain';

function CertificateLiveCanvas({
  cert,
  template,
}: {
  cert: CertificateRecord;
  template?: CertificateTemplateConfig;
}) {
  const canvasHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    renderCertificateToCanvas(cert, template)
      .then((rendered) => {
        if (!active || !canvasHostRef.current) return;
        rendered.style.width = '100%';
        rendered.style.height = 'auto';
        rendered.style.borderRadius = 'var(--md-sys-shape-corner-md)';
        rendered.style.border = '1px solid var(--md-sys-color-outline-variant)';
        canvasHostRef.current.replaceChildren(rendered);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cert, template]);

  return <div ref={canvasHostRef} aria-label={`Pré-visualização do certificado ${cert.code}`} />;
}

export function CertificatesPage() {
  const { codigo } = useParams();
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const { certificates, events } = useAppData();
  const { notify } = useToast();
  const [searchCode, setSearchCode] = useState(codigo || '');
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDownloadPdf = async (cert: CertificateRecord) => {
    setBusyId(`${cert.id}-pdf`);
    try {
      const ev = events.find((e) => e.id === cert.eventId);
      const pdfBytes = await exportCertificatePdf(cert, ev?.certificateTemplate);
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      triggerBlobDownload(blob, `certificado-${cert.code}.pdf`);
      notify('Certificado exportado em PDF!');
    } catch {
      notify('Erro ao gerar PDF do certificado.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadPng = async (cert: CertificateRecord) => {
    setBusyId(`${cert.id}-png`);
    try {
      const ev = events.find((e) => e.id === cert.eventId);
      const blob = await exportCertificatePng(cert, ev?.certificateTemplate);
      triggerBlobDownload(blob, `certificado-${cert.code}.png`);
      notify('Certificado exportado em PNG!');
    } catch {
      notify('Erro ao gerar PNG do certificado.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Public validation route mode
  if (codigo !== undefined) {
    const found = certificates.find(
      (c) => c.code.toLowerCase() === (searchCode || codigo).trim().toLowerCase(),
    );
    return (
      <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
          <h1>Validação Pública de Certificado CAMBLU</h1>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="m3-input"
              style={{ flex: '1 1 16rem' }}
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Código do certificado (ex.: CAMBLU-2026-SECIMED-0042)"
            />
          </div>

          {found ? (
            <div className="m3-card m3-card--gold" style={{ display: 'grid', gap: '0.75rem' }}>
              <span className="m3-badge m3-badge--success" style={{ justifySelf: 'start' }}>
                <Icon name="verified" size={16} />
                Certificado Autêntico e Válido
              </span>
              <h2>{found.ownerName}</h2>
              <p>
                <strong>CPF:</strong> {formatCpf(found.ownerCpf)} · <strong>Evento:</strong> {found.eventTitle} ·{' '}
                <strong>Carga horária:</strong> {found.totalHours}h
              </p>
              <CertificateLiveCanvas
                cert={found}
                template={events.find((e) => e.id === found.eventId)?.certificateTemplate}
              />
            </div>
          ) : (
            <p className="m3-body-medium">Nenhum certificado localizado com o código informado.</p>
          )}
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center' }}>
          <h1 className="m3-headline-medium" style={{ marginBlockEnd: '0.5rem' }}>
            Acesse sua área de Certificados
          </h1>
          <p className="m3-body-medium" style={{ marginInline: 'auto', marginBlockEnd: '1rem' }}>
            Entre com sua conta Google para visualizar e baixar seus certificados em PDF ou PNG.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            onClick={() => signInWithGoogle(isDemoMode ? 'student' : undefined)}
          >
            <Icon name="login" size={18} />
            <span>Entrar com Google</span>
          </button>
        </div>
      </section>
    );
  }

  const myCerts = certificates.filter(
    (c) => c.ownerUid === profile.uid || digitsOnly(c.ownerCpf) === digitsOnly(profile.cpf),
  );

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1>Meus Certificados Automáticos</h1>
          <p className="m3-body-medium">
            Gerados automaticamente após a leitura de presença dos QR Codes do evento. Exporte em PDF (para AACCs) ou PNG.
          </p>
        </div>
        <Link to="/meus-ingressos" className="m3-btn m3-btn--outlined">
          <Icon name="qr_code_2" size={18} />
          <span>Meus Ingressos</span>
        </Link>
      </div>

      {myCerts.length === 0 ? (
        <div className="m3-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <Icon name="workspace_premium" size={44} />
          <h2 className="m3-title-large" style={{ marginBlock: '0.5rem' }}>
            Nenhum certificado emitido ainda
          </h2>
          <p className="m3-body-medium" style={{ marginInline: 'auto' }}>
            Assim que a equipe CAMBLU validar o QR Code do seu ingresso durante o evento, suas horas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {myCerts.map((cert) => {
            const ev = events.find((e) => e.id === cert.eventId);
            return (
              <article key={cert.id} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <span className="m3-badge m3-badge--success" style={{ marginBlockEnd: '0.35rem' }}>
                      <Icon name="verified" size={15} />
                      {cert.totalHours}h registradas · {cert.code}
                    </span>
                    <h2 className="m3-title-large">{cert.eventTitle}</h2>
                    <span className="m3-body-medium">{cert.eventDateLabel}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className="m3-btn m3-btn--filled"
                      disabled={busyId === `${cert.id}-pdf`}
                      onClick={() => handleDownloadPdf(cert)}
                    >
                      <Icon name="picture_as_pdf" size={18} />
                      <span>{busyId === `${cert.id}-pdf` ? 'Gerando...' : 'Baixar PDF'}</span>
                    </button>
                    <button
                      type="button"
                      className="m3-btn m3-btn--blue"
                      disabled={busyId === `${cert.id}-png`}
                      onClick={() => handleDownloadPng(cert)}
                    >
                      <Icon name="image" size={18} />
                      <span>{busyId === `${cert.id}-png` ? 'Gerando...' : 'Baixar PNG'}</span>
                    </button>
                    <Link to={`/certificados/validar/${cert.code}`} className="m3-btn m3-btn--outlined">
                      <Icon name="qr_code_scanner" size={18} />
                      <span>Link de Validação</span>
                    </Link>
                  </div>
                </div>

                <CertificateLiveCanvas cert={cert} template={ev?.certificateTemplate} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
