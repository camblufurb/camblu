import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { CAMBLU_MULHER_INFO } from '../data/institutional';

export function CambluMulherPage() {
  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'grid', gap: '0.85rem' }}>
        <span className="m3-badge m3-badge--gold" style={{ justifySelf: 'start' }}>
          <Icon name="shield_with_heart" size={16} />
          Acolhimento, Escuta e Sigilo
        </span>
        <h1>CAMBLU Mulher</h1>
        <p className="m3-body-large" style={{ color: '#dceddf' }}>
          {CAMBLU_MULHER_INFO.intro}
        </p>
        <p style={{ color: '#f1de97', fontWeight: 600 }}>{CAMBLU_MULHER_INFO.confidentiality}</p>
        <div>
          <Link to="/demandas" className="m3-btn m3-btn--gold">
            <Icon name="lock" size={18} />
            <span>Enviar Relato Sigiloso / Anônimo</span>
          </Link>
        </div>
      </div>

      <div className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Canais de Atendimento e Apoio</h2>
        <div className="grid-two">
          {CAMBLU_MULHER_INFO.emergencyNumbers.map((item) => (
            <div key={item.label} className="m3-card m3-card--tonal" style={{ padding: '1rem' }}>
              <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)', display: 'block', marginBlockEnd: '0.25rem' }}>
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Tipos de Violência (Lei Maria da Penha — Lei nº 11.340)</h2>
          <p className="m3-body-medium">
            Informação para reconhecer situações que violam direitos humanos e exigem denúncia e proteção.
          </p>
        </div>
        <div className="grid-cards">
          {CAMBLU_MULHER_INFO.violenceTypes.map((v) => (
            <article key={v.title} className="m3-card m3-card--tonal" style={{ padding: '1.1rem' }}>
              <h3 className="m3-title-large" style={{ marginBlockEnd: '0.35rem' }}>
                Violência {v.title}
              </h3>
              <p className="m3-body-medium">{v.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
