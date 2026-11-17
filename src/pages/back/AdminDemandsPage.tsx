import { useAppData } from '../../context/AppDataContext';

export function AdminDemandsPage() {
  const { demands } = useAppData();

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Demandas & Ouvidoria ({demands.length})</h1>
        <p className="text-muted">Mensagens enviadas pelos acadêmicos através de `/demandas` e acolhimento CAMBLU Mulher.</p>
      </header>

      <article className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
        {demands.length === 0 ? (
          <p className="text-muted">Nenhuma demanda registrada até o momento.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {demands.map((d) => (
              <div key={d.id} className="m3-card m3-card--tonal" style={{ padding: '0.95rem 1.1rem', display: 'grid', gap: '0.35rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="m3-badge m3-badge--blue">{d.topic}</span>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {d.anonymous ? 'Anônimo' : d.senderName || d.senderEmail} · {d.createdAt.slice(0, 10)}
                  </span>
                </div>
                <p>{d.message}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
