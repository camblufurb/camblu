import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../components/ToastProvider';
import { M3Dialog } from '../components/M3Dialog';
import { Icon } from '../components/Icon';
import { digitsOnly, formatCpf, isValidCpf } from '../lib/validators';
import { API_BASE_URL } from '../lib/firebase';
import type { Ticket } from '../types/domain';

function QrPreviewTile({ code }: { code: string }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(code, { width: 220, margin: 1, color: { dark: '#0f3325', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => {});
  }, [code]);

  if (!dataUrl) return null;
  return (
    <img
      src={dataUrl}
      alt={`QR Code ${code}`}
      width={140}
      height={140}
      style={{
        borderRadius: 'var(--md-sys-shape-corner-sm)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        background: '#ffffff',
        padding: '0.35rem',
      }}
    />
  );
}

export function MyTicketsPage() {
  const { profile, signInWithGoogle, isDemoMode, findDemoUserByCpf } = useAuth();
  const { tickets, events, updateTicket } = useAppData();
  const { notify } = useToast();

  const [transferTargetTicket, setTransferTargetTicket] = useState<Ticket | null>(null);
  const [recipientCpf, setRecipientCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [transferring, setTransferring] = useState(false);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center' }}>
          <h1 className="m3-headline-medium" style={{ marginBlockEnd: '0.5rem' }}>
            Entre para ver seus Ingressos
          </h1>
          <p className="m3-body-medium" style={{ marginInline: 'auto', marginBlockEnd: '1rem' }}>
            Seus QR Codes de acesso e a transferência de ingressos por CPF ficam vinculados à sua conta Google.
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

  const myTickets = tickets.filter(
    (t) => t.ownerUid === profile.uid || digitsOnly(t.ownerCpf) === digitsOnly(profile.cpf),
  );

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetTicket) return;
    setCpfError('');

    if (!isValidCpf(recipientCpf)) {
      setCpfError('Digite um CPF válido com 11 dígitos.');
      return;
    }

    const cleanRecipient = digitsOnly(recipientCpf);
    if (cleanRecipient === digitsOnly(profile.cpf)) {
      setCpfError('Você já é o titular atual deste ingresso.');
      return;
    }

    setTransferring(true);
    try {
      if (!isDemoMode) {
        const res = await fetch(`${API_BASE_URL}/tickets/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: transferTargetTicket.id,
            fromUid: profile.uid,
            toCpf: cleanRecipient,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || 'Falha na transferência.');
        }
        const updated = (await res.json()) as { ticket: Ticket };
        await updateTicket(updated.ticket);
      } else {
        const destUser = findDemoUserByCpf(cleanRecipient);
        if (!destUser) {
          setCpfError('Nenhuma conta cadastrada encontrada com este CPF (tente 390.533.447-05 no modo demo).');
          setTransferring(false);
          return;
        }
        const updated: Ticket = {
          ...transferTargetTicket,
          ownerUid: destUser.uid,
          ownerName: destUser.name,
          ownerCpf: destUser.cpf,
          ownerEmail: destUser.email,
          transferHistory: [
            ...transferTargetTicket.transferHistory,
            {
              fromUid: profile.uid,
              fromCpf: profile.cpf,
              toUid: destUser.uid,
              toCpf: destUser.cpf,
              transferredAt: new Date().toISOString(),
            },
          ],
        };
        await updateTicket(updated);
      }

      notify('Ingresso transferido com sucesso!');
      setTransferTargetTicket(null);
      setRecipientCpf('');
    } catch (err) {
      setCpfError(err instanceof Error ? err.message : 'Erro ao transferir ingresso.');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1>Meus Ingressos & QR Codes</h1>
          <p className="m3-body-medium">
            Apresente cada QR Code na entrada ou sessão correspondente para contabilizar suas horas de certificado.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/eventos" className="m3-btn m3-btn--tonal">
            <Icon name="explore" size={18} />
            <span>Explorar Eventos</span>
          </Link>
          <Link to="/certificados" className="m3-btn m3-btn--blue">
            <Icon name="workspace_premium" size={18} />
            <span>Ver Certificados</span>
          </Link>
        </div>
      </div>

      {myTickets.length === 0 ? (
        <div className="m3-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <Icon name="confirmation_number" size={44} />
          <h2 className="m3-title-large" style={{ marginBlock: '0.5rem' }}>
            Nenhum ingresso encontrado
          </h2>
          <p className="m3-body-medium" style={{ marginInline: 'auto', marginBlockEnd: '1rem' }}>
            Seus ingressos adquiridos ou transferidos via CPF aparecerão aqui automaticamente.
          </p>
          <Link to="/eventos" className="m3-btn m3-btn--filled">
            Ir para Eventos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {myTickets.map((ticket) => {
            const ev = events.find((e) => e.id === ticket.eventId);
            const anyCheckedIn = ticket.qrInstances.some((q) => Boolean(q.checkedInAt));
            return (
              <article key={ticket.id} className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBlockEnd: '0.4rem' }}>
                      <span className="m3-badge m3-badge--blue">{ticket.lotName}</span>
                      <span className="m3-badge">Titular: {ticket.ownerName}</span>
                    </div>
                    <h2 className="m3-title-large">{ticket.eventTitle}</h2>
                    {ticket.discountReason && (
                      <span className="m3-body-medium" style={{ display: 'block', marginBlockStart: '0.2rem' }}>
                        {ticket.discountReason}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                    {ev?.mode === 'virtual' && ev.virtualAccessUrl && (
                      <a href={ev.virtualAccessUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--blue">
                        <Icon name="videocam" size={18} />
                        <span>Acessar Sala Virtual</span>
                      </a>
                    )}
                    <button
                      type="button"
                      className="m3-btn m3-btn--outlined"
                      disabled={anyCheckedIn}
                      title={anyCheckedIn ? 'Ingressos com presença já registrada não podem ser transferidos.' : undefined}
                      onClick={() => {
                        setTransferTargetTicket(ticket);
                        setRecipientCpf('');
                        setCpfError('');
                      }}
                    >
                      <Icon name="swap_horiz" size={18} />
                      <span>Transferir via CPF</span>
                    </button>
                  </div>
                </div>

                <div className="grid-cards">
                  {ticket.qrInstances.map((qr) => (
                    <div
                      key={qr.qrCode}
                      className="m3-card m3-card--tonal"
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.9rem',
                        alignItems: 'center',
                        padding: '1rem',
                      }}
                    >
                      <QrPreviewTile code={qr.qrCode} />
                      <div style={{ flex: '1 1 10rem', display: 'grid', gap: '0.3rem' }}>
                        <span
                          className={`m3-badge ${qr.checkedInAt ? 'm3-badge--success' : 'm3-badge--gold'}`}
                          style={{ justifySelf: 'start' }}
                        >
                          <Icon name={qr.checkedInAt ? 'verified' : 'schedule'} size={15} />
                          {qr.checkedInAt ? 'Presença validada' : 'Aguardando leitura'}
                        </span>
                        <strong>{qr.label}</strong>
                        <span className="m3-body-medium" style={{ fontSize: '0.84rem' }}>
                          {new Date(qr.dateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                          Libera +{qr.certificateHours}h de certificado
                        </span>
                        <code style={{ fontSize: '0.75rem', opacity: 0.78 }}>{qr.qrCode}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <M3Dialog
        open={Boolean(transferTargetTicket)}
        onClose={() => setTransferTargetTicket(null)}
        title="Transferir Ingresso por CPF"
      >
        {transferTargetTicket && (
          <form onSubmit={handleTransferSubmit} style={{ display: 'grid', gap: '1rem' }} noValidate>
            <p className="m3-body-medium">
              Você está transferindo <strong>{transferTargetTicket.eventTitle}</strong> ({transferTargetTicket.lotName}).
              O destinatário precisa possuir uma conta cadastrada neste portal com o CPF informado.
            </p>
            <div className="m3-field">
              <label htmlFor="transfer-cpf">CPF do destinatário</label>
              <input
                id="transfer-cpf"
                type="text"
                inputMode="numeric"
                className="m3-input"
                placeholder="000.000.000-00"
                required
                aria-invalid={cpfError ? 'true' : 'false'}
                aria-describedby={cpfError ? 'transfer-cpf-error' : undefined}
                value={recipientCpf}
                onChange={(e) => {
                  setRecipientCpf(formatCpf(e.target.value));
                  setCpfError('');
                }}
              />
              <span id="transfer-cpf-error" className="m3-error-msg" data-visible={Boolean(cpfError)}>
                <Icon name="error" size={16} />
                {cpfError}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button type="button" className="m3-btn m3-btn--outlined" onClick={() => setTransferTargetTicket(null)}>
                Cancelar
              </button>
              <button type="submit" className="m3-btn m3-btn--filled" disabled={transferring}>
                <Icon name="swap_horiz" size={18} />
                <span>{transferring ? 'Transferindo...' : 'Confirmar Transferência'}</span>
              </button>
            </div>
          </form>
        )}
      </M3Dialog>
    </section>
  );
}
