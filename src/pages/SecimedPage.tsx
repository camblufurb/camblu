import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { SECIMED_INFO } from '../data/institutional';
import { resolveEventPalette } from '../lib/colorHarmony';

const SECIMED_PILLARS = [
  {
    id: 'palestras',
    spanDesktop: 'span 7',
    accentKey: 'primary',
    icon: 'podium',
    title: 'Palestras Magnas',
    subtitle: 'Simpósios e conferências com especialistas nacionais e professores de referência.',
    photoLabel: 'Foto: Palestras Magnas SECIMED',
  },
  {
    id: 'workshops',
    spanDesktop: 'span 5',
    accentKey: 'secondary1',
    icon: 'medical_services',
    title: 'Workshops Práticos das Ligas',
    subtitle: 'Sutura, atendimento ao trauma, vias aéreas, ECG e estações hands-on.',
    photoLabel: 'Foto: Estações práticas & Ligas',
  },
  {
    id: 'rodas',
    spanDesktop: 'span 5',
    accentKey: 'secondary2',
    icon: 'forum',
    title: 'Rodas de Conversa',
    subtitle: 'Diálogos abertos sobre carreira médica, residência, extensão e humanização.',
    photoLabel: 'Foto: Rodas de Conversa',
  },
  {
    id: 'trabalhos',
    spanDesktop: 'span 7',
    accentKey: 'primary',
    icon: 'article',
    title: 'Mostra Científica & Anais ISSN',
    subtitle: 'Apresentações orais, banners avaliados e publicação nos Anais indexados no Zenodo.',
    photoLabel: 'Foto: Apresentações Científicas',
  },
  {
    id: 'networking',
    spanDesktop: 'span 4',
    accentKey: 'secondary2',
    icon: 'handshake',
    title: 'Networking Médico',
    subtitle: 'Conexão entre todas as fases do curso, egressos, docentes e patrocinadores.',
    photoLabel: 'Foto: Networking & Integração',
  },
  {
    id: 'coffee',
    spanDesktop: 'span 4',
    accentKey: 'secondary1',
    icon: 'local_cafe',
    title: 'Coffee Breaks Completos',
    subtitle: 'Pausas temáticas entre blocos científicos para convivência e troca de ideias.',
    photoLabel: 'Foto: Coffee Break SECIMED',
  },
  {
    id: 'brindes',
    spanDesktop: 'span 4',
    accentKey: 'primary',
    icon: 'redeem',
    title: 'Brindes, Sorteios & Integração',
    subtitle: 'Kit congressista exclusivo, premiações científicas e momentos de confraternização.',
    photoLabel: 'Foto: Brindes & Sorteios',
  },
] as const;

/**
 * SECIMED editorial showcase featuring configurable 4-color expressive palette,
 * animated Climate Crisis variable typography, and photography placeholders for event highlights.
 */
export function SecimedPage() {
  const { events } = useAppData();

  const secimedEvent = useMemo(
    () =>
      events.find((e) => e.isSecimed && e.published) ||
      events.find((e) => e.isSecimed) ||
      events[0],
    [events],
  );

  const palette = resolveEventPalette(
    secimedEvent ? { ...secimedEvent, isSecimed: true } : { isSecimed: true },
  );
  const featurePhotos = secimedEvent?.secimedFeaturePhotos || {};

  const colorByKey = (key: 'primary' | 'secondary1' | 'secondary2') => palette[key];

  return (
    <div
      className="secimed-theme-stage m3-reveal"
      style={
        {
          '--secimed-primary': palette.primary,
          '--secimed-secondary-1': palette.secondary1,
          '--secimed-secondary-2': palette.secondary2,
          '--secimed-bg': palette.background,
        } as CSSProperties
      }
    >
      <div className="container" style={{ display: 'grid', gap: 'clamp(1.75rem, 4vw, 3rem)' }}>
        <h1 className="visually-hidden">SECIMED — Semana Científica de Medicina da FURB</h1>

        {/* Título solto centralizado em Climate Crisis YEAR 2050 -> 1979 */}
        <header className="secimed-hero-header">
          <span
            className="m3-badge secimed-hero-badge"
            style={{
              background: palette.secondary2,
              color: '#1b2109',
            }}
          >
            Desde {SECIMED_INFO.since} · Anais ISSN {SECIMED_INFO.issn} · Medicina FURB
          </span>

          <div aria-hidden="true" className="secimed-climate-title">
            SECIMED
          </div>

          <p className="page-hero-desc" style={{ color: '#2b2025', fontWeight: 500, marginInline: 'auto' }}>
            A <strong>Semana Científica de Medicina de Blumenau</strong> é o maior encontro acadêmico anual da MEDFURB.
            Organizada pelo CAMBLU desde 2002, reúne cinco dias intensivos de imersão científica, palestras magnas,
            estações práticas das ligas acadêmicas, mostra de pesquisas avaliadas por banca e integração entre todas as fases.
          </p>

          <div className="secimed-hero-actions">
            <Link
              to={secimedEvent ? `/eventos/${secimedEvent.slug}` : '/eventos'}
              className="m3-btn"
              style={{ background: palette.primary, color: '#ffffff' }}
            >
              <Icon name="confirmation_number" size={19} />
              <span>Ver Edição Atual / Ingressos</span>
            </Link>
            <Link
              to="/secimed/anais-secimed"
              className="m3-btn"
              style={{ background: palette.secondary1, color: '#2b0d14' }}
            >
              <Icon name="menu_book" size={19} />
              <span>Anais Científicos (ISSN)</span>
            </Link>
            <a
              href={SECIMED_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="m3-btn m3-btn--outlined"
              style={{ borderColor: palette.primary, color: palette.primary }}
            >
              <Icon name="open_in_new" size={18} />
              <span>{SECIMED_INFO.instagramHandle}</span>
            </a>
          </div>
        </header>

        {/* Bloco Material You Expressive sobre o que é a SECIMED */}
        <div className="grid-two">
          <article
            className="m3-card"
            style={{
              background: palette.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--md-sys-shape-corner-xl)',
              display: 'grid',
              gap: '0.85rem',
            }}
          >
            <span className="m3-label-large" style={{ color: palette.secondary1 }}>
              Ciência, Extensão e Prática Clínica
            </span>
            <h2 style={{ color: '#ffffff' }}>Cinco dias de vivência médica além da sala de aula</h2>
            <p style={{ color: 'rgb(255 255 255 / 0.9)' }}>
              Cada edição da SECIMED é construída por comissão científica discente e corpo docente para conectar os
              ciclos básico, clínico e internato por meio de debates atuais, inovação em saúde e produção científica de qualidade.
            </p>
          </article>

          <article
            className="m3-card"
            style={{
              background: '#ffffff',
              border: `2px solid ${palette.secondary2}`,
              borderRadius: 'var(--md-sys-shape-corner-xl)',
              display: 'grid',
              gap: '0.85rem',
              alignContent: 'center',
            }}
          >
            <span className="m3-label-large" style={{ color: palette.primary }}>
              Publicação & Certificação Oficial
            </span>
            <h2 style={{ color: '#24191e' }}>Do resumo submetido ao certificado de AACCs</h2>
            <p className="text-muted">
              Os trabalhos aprovados passam por revisão duplo-cega por pares e integram os Anais SECIMED sob licença aberta,
              enquanto os participantes acumulam horas complementares via check-in digital por QR Code.
            </p>
          </article>
        </div>

        {/* Grade assimétrica Material You Expressive com placeholders de fotos das características */}
        <section aria-label="Experiências e características da SECIMED" style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ textAlign: 'center', maxInlineSize: '44rem', marginInline: 'auto', display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ color: palette.primary }}>O que acontece durante a SECIMED</h2>
            <p className="text-muted">
              Espaços dedicados às fotografias oficiais de cada frente do congresso.
            </p>
          </div>

          <div className="secimed-expressive-grid">
            {SECIMED_PILLARS.map((item) => {
              const accent = colorByKey(item.accentKey);
              const photoSrc = featurePhotos[item.id];
              return (
                <article
                  key={item.id}
                  className="m3-card m3-card--interactive secimed-pillar-card"
                  style={
                    {
                      '--secimed-span': item.spanDesktop,
                      background: '#ffffff',
                      borderColor: accent,
                      borderWidth: '2px',
                      borderRadius: 'var(--md-sys-shape-corner-xl)',
                      display: 'grid',
                      gap: '0.9rem',
                      alignContent: 'space-between',
                    } as CSSProperties
                  }
                >
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      borderRadius: 'var(--md-sys-shape-corner-lg)',
                      overflow: 'hidden',
                      border: photoSrc ? 'none' : `2px dashed ${accent}`,
                      background: photoSrc
                        ? 'var(--md-sys-color-surface-container)'
                        : `color-mix(in oklab, ${accent} 14%, ${palette.background})`,
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                      padding: photoSrc ? 0 : '1rem',
                    }}
                  >
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt={item.title}
                        style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', gap: '0.35rem', color: palette.primary }}>
                        <Icon name={item.icon} size={36} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{item.photoLabel}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <h3 style={{ color: palette.primary }}>{item.title}</h3>
                    <p className="text-muted">{item.subtitle}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
