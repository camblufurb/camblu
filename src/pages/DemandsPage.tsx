import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';
import { API_BASE_URL, ADMIN_EMAIL } from '../lib/firebase';
import type { DemandTopic } from '../types/domain';

const TOPICS: { topic: DemandTopic; hint: string; icon: string }[] = [
  { topic: 'Demanda de turma', hint: 'Assuntos coletivos, cronogramas, salas ou disciplinas', icon: 'groups' },
  { topic: 'Demanda pessoal', hint: 'Orientação acadêmica individual ou acompanhamento', icon: 'person' },
  { topic: 'Dúvida', hint: 'Perguntas sobre eventos, ligas, editais ou espaços', icon: 'help' },
  { topic: 'Reclamação', hint: 'Relato formal para mediação junto ao departamento', icon: 'report' },
  { topic: 'CAMBLU Mulher', hint: 'Sigiloso · lido apenas por duas mulheres da gestão', icon: 'shield_with_heart' },
];

export function DemandsPage() {
  const { profile, isDemoMode } = useAuth();
  const { addDemand } = useAppData();
  const { notify } = useToast();

  const [topic, setTopic] = useState<DemandTopic>('Demanda de turma');
  const [anonymous, setAnonymous] = useState(false);
  const [senderName, setSenderName] = useState(profile?.name || '');
  const [senderEmail, setSenderEmail] = useState(profile?.email || '');
  const [turma, setTurma] = useState(profile?.turma || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleTopicChange = (next: DemandTopic) => {
    setTopic(next);
    if (next === 'CAMBLU Mulher') setAnonymous(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      notify('Escreva a descrição da demanda antes de enviar.', 'error');
      return;
    }

    setSending(true);
    let dispatchedEmail = false;
    try {
      if (!isDemoMode) {
        const res = await fetch(`${API_BASE_URL}/demands/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            anonymous,
            senderName: anonymous ? undefined : senderName,
            senderEmail: anonymous ? undefined : senderEmail,
            turma,
            message,
          }),
        });
        dispatchedEmail = res.ok;
      }

      await addDemand({
        id: `dem-${Date.now().toString(36)}`,
        topic,
        anonymous,
        senderName: anonymous ? undefined : senderName,
        senderEmail: anonymous ? undefined : senderEmail,
        turma,
        message: message.trim(),
        dispatchedEmail,
        createdAt: new Date().toISOString(),
      });

      setMessage('');
      notify(`Mensagem registrada com assunto "${topic}" para ${ADMIN_EMAIL}!`);
    } catch {
      notify('Falha ao enviar demanda.', 'error');
    } finally {
      setSending(false);
    }
  };

  const mailtoHref = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(
    `${turma ? `Turma: ${turma}\n` : ''}${!anonymous && senderName ? `Nome: ${senderName}\n` : ''}\n${message}`,
  )}`;

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="support_agent" size={16} />
            Canal Direto com o CAMBLU
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Enviar Demanda e Pedir Ajuda</h1>
          <p style={{ color: '#dceddf' }}>
            Selecione o tópico abaixo para direcionar sua mensagem diretamente para{' '}
            <strong>{ADMIN_EMAIL}</strong> com o assunto exato escolhido por você.
          </p>
        </div>
        <Link to="/camblu-mulher" className="m3-btn m3-btn--gold">
          <Icon name="shield_with_heart" size={19} />
          <span>Conhecer CAMBLU Mulher</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="m3-card" style={{ display: 'grid', gap: '1.25rem' }}>
        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.65rem' }}>
          <legend className="m3-title-large" style={{ marginBlockEnd: '0.25rem' }}>
            1. Selecione o tópico (Assunto do e-mail)
          </legend>
          <div className="grid-cards">
            {TOPICS.map((item) => {
              const selected = topic === item.topic;
              return (
                <button
                  key={item.topic}
                  type="button"
                  className={`m3-card ${selected ? 'm3-card--gold' : 'm3-card--tonal'}`}
                  style={{
                    textAlign: 'start',
                    cursor: 'pointer',
                    padding: '0.95rem 1rem',
                    borderColor: selected ? 'var(--md-sys-color-primary)' : 'transparent',
                    borderWidth: '2px',
                    display: 'grid',
                    gap: '0.25rem',
                  }}
                  aria-pressed={selected}
                  onClick={() => handleTopicChange(item.topic)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Icon name={item.icon} size={20} />
                    <strong>{item.topic}</strong>
                  </div>
                  <span style={{ fontSize: '0.82rem', opacity: 0.88 }}>{item.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 650, cursor: 'pointer' }}>
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span>Enviar de forma anônima (não incluir meu nome nem e-mail)</span>
        </label>

        {!anonymous && (
          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="dem-name">Seu nome</label>
              <input
                id="dem-name"
                type="text"
                className="m3-input"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="m3-field">
              <label htmlFor="dem-email">Seu e-mail para retorno</label>
              <input
                id="dem-email"
                type="email"
                className="m3-input"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="m3-field">
          <label htmlFor="dem-turma">Turma (opcional, apenas números)</label>
          <input
            id="dem-turma"
            type="text"
            inputMode="numeric"
            className="m3-input"
            style={{ maxInlineSize: '14rem' }}
            placeholder="Ex.: 63"
            value={turma}
            onChange={(e) => setTurma(e.target.value.replace(/\D+/g, ''))}
          />
        </div>

        <div className="m3-field">
          <label htmlFor="dem-msg">Sua mensagem ({topic})</label>
          <textarea
            id="dem-msg"
            className="m3-textarea"
            required
            placeholder="Descreva sua demanda, dúvida ou relato com o máximo de detalhes..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" className="m3-btn m3-btn--filled" disabled={sending}>
            <Icon name="send" size={18} />
            <span>{sending ? 'Enviando...' : `Enviar para ${ADMIN_EMAIL}`}</span>
          </button>
          <a href={mailtoHref} className="m3-btn m3-btn--outlined">
            <Icon name="mail" size={18} />
            <span>Abrir no meu app de E-mail</span>
          </a>
        </div>
      </form>
    </section>
  );
}
