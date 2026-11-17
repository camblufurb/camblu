import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import {
  generateTransparencyPostSlides,
  type TransparencyPosterSlide,
} from '../../lib/transparencyPosterGenerator';
import { TRANSPARENCY_SHEETS } from './AdminTransparencyFinancePage';

/**
 * Generates and downloads the 3 monthly transparency carousel images (1080x1350)
 * featuring the monthly net result and pie charts for incomes and expenditures.
 */
export function AdminTransparencyPostsPage() {
  const { transparencyEntries } = useAppData();
  const { notify } = useToast();

  const [posterMonth, setPosterMonth] = useState('Outubro');
  const [slides, setSlides] = useState<TransparencyPosterSlide[]>([]);

  const handleGeneratePosts = () => {
    const targetEntries = transparencyEntries.filter((e) => e.sheet === posterMonth);
    const generated = generateTransparencyPostSlides(`${posterMonth} 2026`, targetEntries);
    setSlides(generated);
    notify(`3 imagens geradas para o post mensal de ${posterMonth}!`);
  };

  const downloadSlide = (slide: TransparencyPosterSlide) => {
    const a = document.createElement('a');
    a.href = slide.dataUrl;
    a.download = `transparencia-camblu-${posterMonth.toLowerCase()}-slide-${slide.index}.png`;
    a.click();
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Posts Mensais de Transparência (Instagram 1080×1350)</h1>
        <p className="text-muted">
          Gere o carrossel de 3 cards (Resultado do mês + gráficos de pizza de Entradas e Saídas e Investimentos).
        </p>
      </header>

      <article className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <select
            className="m3-select"
            style={{ inlineSize: 'auto' }}
            value={posterMonth}
            onChange={(e) => setPosterMonth(e.target.value)}
            aria-label="Mês do post de transparência"
          >
            {TRANSPARENCY_SHEETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className="m3-btn m3-btn--gold" onClick={handleGeneratePosts}>
            <Icon name="auto_awesome" size={18} />
            <span>Gerar 3 Imagens</span>
          </button>
          {slides.length > 0 && (
            <button
              type="button"
              className="m3-btn m3-btn--blue"
              onClick={() => slides.forEach((s) => downloadSlide(s))}
            >
              <Icon name="download" size={18} />
              <span>Baixar Todas (PNG)</span>
            </button>
          )}
        </div>

        {slides.length > 0 && (
          <div className="grid-cards">
            {slides.map((s) => (
              <div key={s.index} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.6rem', padding: '0.85rem' }}>
                <img
                  src={s.dataUrl}
                  alt={`Slide ${s.index}: ${s.title}`}
                  style={{ borderRadius: 'var(--md-sys-shape-corner-md)', inlineSize: '100%' }}
                />
                <button type="button" className="m3-btn m3-btn--outlined" onClick={() => downloadSlide(s)}>
                  <Icon name="download" size={17} />
                  <span>Baixar Slide {s.index} ({s.title})</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
