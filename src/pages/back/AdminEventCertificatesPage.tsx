import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAdminEvent } from '../../components/admin/AdminEventShell';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../../lib/certificateRenderer';
import { formatCpf } from '../../lib/validators';
import type { CertificateTemplateConfig } from '../../types/domain';

type EditableCertField = 'name' | 'cpf' | 'hours' | 'code' | 'qr';

const DEMO_LABELS: Record<Exclude<EditableCertField, 'qr'>, string> = {
  name: 'Marina Souza',
  cpf: 'CPF: 529.982.247-25',
  hours: 'Carga horária válida: 15 horas',
  code: 'Código: CAMBLU-2026-SECIMED-0042',
};

const FIELD_BUTTON_NAMES: Record<EditableCertField, string> = {
  name: 'Nome (Demo)',
  cpf: 'CPF (Demo)',
  hours: 'Horas (Demo)',
  code: 'Código',
  qr: 'QR Code',
};

type DragState =
  | { kind: 'move'; key: EditableCertField }
  | {
      kind: 'resize';
      key: EditableCertField;
      startClientX: number;
      startFontPt: number;
      startWidthPct: number;
      startQrPct: number;
    };

/**
 * Interactive WYSIWYG certificate designer with live demo data, drag positioning,
 * and corner resize handles on top of uploaded Canva artwork (event/date remain on artwork).
 */
export function AdminEventCertificatesPage() {
  const event = useAdminEvent();
  const { certificates, saveEvent } = useAppData();
  const { notify } = useToast();
  const tableCaptionId = useId();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [activeField, setActiveField] = useState<EditableCertField>('name');
  const [tplConfig, setTplConfig] = useState<CertificateTemplateConfig>(
    () => event.certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE,
  );
  const [demoQrUrl, setDemoQrUrl] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    setTplConfig(event.certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE);
  }, [event]);

  useEffect(() => {
    QRCode.toDataURL('https://camblu.org/certificados/validar/CAMBLU-2026-SECIMED-0042', {
      width: 200,
      margin: 1,
      color: { dark: '#0f3325', light: '#ffffff' },
    })
      .then(setDemoQrUrl)
      .catch(() => {});
  }, []);

  const eventCertificates = useMemo(
    () => certificates.filter((c) => c.eventId === event.id),
    [certificates, event.id],
  );

  const handleUploadCanvaPng = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        setTplConfig((prev) => ({
          ...prev,
          templateImageUrl: reader.result as string,
          templateWidthPx: img.naturalWidth || 1754,
          templateHeightPx: img.naturalHeight || 1240,
        }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const box = canvasRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      if (dragState.kind === 'move') {
        const xPercent = Math.max(4, Math.min(96, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
        const yPercent = Math.max(4, Math.min(96, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));

        setTplConfig((prev) => {
          if (dragState.key === 'qr') {
            return {
              ...prev,
              fields: {
                ...prev.fields,
                qr: {
                  ...(prev.fields.qr || { xPercent: 85, yPercent: 76, sizePercent: 11 }),
                  xPercent,
                  yPercent,
                },
              },
            };
          }
          const k = dragState.key;
          return {
            ...prev,
            fields: {
              ...prev.fields,
              [k]: {
                ...prev.fields[k],
                xPercent,
                yPercent,
              },
            },
          };
        });
      } else {
        const deltaXRatio = (e.clientX - dragState.startClientX) / rect.width;
        if (dragState.key === 'qr') {
          const nextSize = Math.max(5, Math.min(28, Math.round((dragState.startQrPct + deltaXRatio * 55) * 10) / 10));
          setTplConfig((prev) => ({
            ...prev,
            fields: {
              ...prev.fields,
              qr: {
                ...(prev.fields.qr || { xPercent: 85, yPercent: 76, sizePercent: 11 }),
                sizePercent: nextSize,
              },
            },
          }));
        } else {
          const k = dragState.key;
          const nextWidth = Math.max(18, Math.min(92, Math.round(dragState.startWidthPct + deltaXRatio * 100)));
          const nextFont = Math.max(10, Math.min(80, Math.round(dragState.startFontPt + deltaXRatio * 54)));
          setTplConfig((prev) => ({
            ...prev,
            fields: {
              ...prev.fields,
              [k]: {
                ...prev.fields[k],
                widthPercent: nextWidth,
                fontSizePt: nextFont,
              },
            },
          }));
        }
      }
    };

    const stopDrag = () => setDragState(null);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDrag);
    };
  }, [dragState]);

  const handleSaveTemplate = async () => {
    await saveEvent({ ...event, certificateTemplate: tplConfig });
    notify(`Template de certificado salvo para "${event.title}"!`);
  };

  const qrPos = tplConfig.fields.qr || { xPercent: 85, yPercent: 76, sizePercent: 11 };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Editor Visual de Certificados (Arrastar & Redimensionar)</h2>
          <p className="text-muted">
            Envie a arte de fundo do Canva (que já contém nome do evento e data), depois arraste os elementos com dados de demo e redimensione pelo canto azul inferior direito.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="file"
            accept="image/png,image/jpeg"
            aria-label="Enviar PNG do certificado"
            onChange={(e) => handleUploadCanvaPng(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {(['name', 'cpf', 'hours', 'code', 'qr'] as EditableCertField[]).map((fk) => (
              <button
                key={fk}
                type="button"
                className="m3-chip"
                aria-pressed={activeField === fk}
                onClick={() => setActiveField(fk)}
              >
                {FIELD_BUTTON_NAMES[fk]}
              </button>
            ))}
          </div>
        </div>

        {/* Fine numeric controls for active selected element */}
        {activeField !== 'qr' ? (
          <div className="grid-cards" style={{ padding: '0.75rem', borderRadius: 'var(--md-sys-shape-corner-md)', background: 'var(--md-sys-color-surface-container-low)' }}>
            <div className="m3-field">
              <label htmlFor="cert-fsize">Tamanho fonte ({FIELD_BUTTON_NAMES[activeField]}): {tplConfig.fields[activeField].fontSizePt} pt</label>
              <input
                id="cert-fsize"
                type="range"
                min={12}
                max={76}
                value={tplConfig.fields[activeField].fontSizePt}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTplConfig((prev) => ({
                    ...prev,
                    fields: {
                      ...prev.fields,
                      [activeField]: { ...prev.fields[activeField], fontSizePt: v },
                    },
                  }));
                }}
              />
            </div>
            <div className="m3-field">
              <label htmlFor="cert-color">Cor do texto</label>
              <input
                id="cert-color"
                type="color"
                value={tplConfig.fields[activeField].colorHex}
                onChange={(e) => {
                  const v = e.target.value;
                  setTplConfig((prev) => ({
                    ...prev,
                    fields: {
                      ...prev.fields,
                      [activeField]: { ...prev.fields[activeField], colorHex: v },
                    },
                  }));
                }}
                style={{ inlineSize: '3.2rem', blockSize: '2.4rem', borderRadius: '0.45rem' }}
              />
            </div>
          </div>
        ) : (
          <div className="m3-field" style={{ padding: '0.75rem', borderRadius: 'var(--md-sys-shape-corner-md)', background: 'var(--md-sys-color-surface-container-low)', maxInlineSize: '22rem' }}>
            <label htmlFor="cert-qr-sz">Tamanho QR Code: {qrPos.sizePercent}%</label>
            <input
              id="cert-qr-sz"
              type="range"
              min={6}
              max={24}
              step={0.5}
              value={qrPos.sizePercent}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTplConfig((prev) => ({
                  ...prev,
                  fields: { ...prev.fields, qr: { ...qrPos, sizePercent: v } },
                }));
              }}
            />
          </div>
        )}

        <div
          ref={canvasRef}
          aria-label="Área visual interativa dos elementos do certificado"
          style={{
            position: 'relative',
            inlineSize: '100%',
            aspectRatio: `${tplConfig.templateWidthPx} / ${tplConfig.templateHeightPx}`,
            containerType: 'inline-size',
            background: tplConfig.templateImageUrl
              ? `url("${tplConfig.templateImageUrl}") center / cover no-repeat`
              : 'linear-gradient(135deg, #fbfcf9, #e1ebe4)',
            border: '2px dashed var(--md-sys-color-primary)',
            borderRadius: 'var(--md-sys-shape-corner-md)',
            overflow: 'hidden',
          }}
        >
          {(['name', 'cpf', 'hours', 'code'] as const).map((fk) => {
            const pos = tplConfig.fields[fk];
            const isActive = activeField === fk;
            const scaledFontCqw = `${((pos.fontSizePt / 1754) * 100 * 1.15).toFixed(2)}cqw`;
            return (
              <div
                key={fk}
                className="cert-field-box"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActiveField(fk);
                  setDragState({ kind: 'move', key: fk });
                }}
                style={{
                  left: `${pos.xPercent}%`,
                  top: `${pos.yPercent}%`,
                  width: `${pos.widthPercent || 55}%`,
                  color: pos.colorHex,
                  fontSize: `clamp(10px, ${scaledFontCqw}, 38px)`,
                  fontWeight: fk === 'name' || fk === 'hours' ? 800 : 600,
                  textAlign: pos.align,
                  padding: '0.2rem 0.45rem',
                  border: isActive ? '2px solid var(--camblu-action-blue)' : '1px dashed rgb(15 51 37 / 0.42)',
                  background: isActive ? 'rgb(255 255 255 / 0.55)' : 'rgb(255 255 255 / 0.28)',
                }}
              >
                <span>{DEMO_LABELS[fk]}</span>
                {isActive && (
                  <span
                    className="cert-resize-handle"
                    aria-label={`Redimensionar ${FIELD_BUTTON_NAMES[fk]}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDragState({
                        kind: 'resize',
                        key: fk,
                        startClientX: e.clientX,
                        startFontPt: pos.fontSizePt,
                        startWidthPct: pos.widthPercent || 55,
                        startQrPct: qrPos.sizePercent,
                      });
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* QR Code draggable + resizable preview */}
          <div
            className="cert-field-box"
            onPointerDown={(e) => {
              e.stopPropagation();
              setActiveField('qr');
              setDragState({ kind: 'move', key: 'qr' });
            }}
            style={{
              left: `${qrPos.xPercent}%`,
              top: `${qrPos.yPercent}%`,
              width: `${qrPos.sizePercent}%`,
              aspectRatio: '1 / 1',
              background: '#ffffff',
              padding: '0.25rem',
              border: activeField === 'qr' ? '2px solid var(--camblu-action-blue)' : '1px dashed rgb(15 51 37 / 0.45)',
            }}
          >
            {demoQrUrl && (
              <img
                src={demoQrUrl}
                alt="QR Code demo do certificado"
                style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              />
            )}
            {activeField === 'qr' && (
              <span
                className="cert-resize-handle"
                aria-label="Redimensionar QR Code"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragState({
                    kind: 'resize',
                    key: 'qr',
                    startClientX: e.clientX,
                    startFontPt: 20,
                    startWidthPct: 20,
                    startQrPct: qrPos.sizePercent,
                  });
                }}
              />
            )}
          </div>
        </div>

        <button type="button" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }} onClick={handleSaveTemplate}>
          <Icon name="save" size={18} />
          <span>Salvar Posições no Evento</span>
        </button>
      </article>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Certificados Emitidos neste Evento ({eventCertificates.length})</h2>
        {eventCertificates.length === 0 ? (
          <p className="text-muted">
            Nenhum certificado emitido ainda para este evento. Eles são liberados automaticamente assim que um QR Code é validado na portaria.
          </p>
        ) : (
          <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
            <table className="admin-table">
              <caption id={tableCaptionId} className="visually-hidden">
                Certificados emitidos para {event.title}
              </caption>
              <thead>
                <tr>
                  <th>Código de Validação</th>
                  <th>Titular</th>
                  <th>CPF</th>
                  <th>Horas</th>
                  <th>Emitido em</th>
                  <th>Validação Pública</th>
                </tr>
              </thead>
              <tbody>
                {eventCertificates.map((cert) => (
                  <tr key={cert.id}>
                    <th><code>{cert.code}</code></th>
                    <td>{cert.ownerName}</td>
                    <td>{formatCpf(cert.ownerCpf)}</td>
                    <td><strong>{cert.totalHours}h</strong></td>
                    <td>{new Date(cert.issuedAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Link to={`/certificados/validar/${cert.code}`} className="m3-btn m3-btn--text" style={{ minBlockSize: '34px' }}>
                        Verificar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
