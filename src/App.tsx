import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './i18n/i18n';
import { ToastProvider } from './components/ToastProvider';
import { Layout } from './components/Layout';
import { Icon } from './components/Icon';
import { SponsorsStrip } from './components/SponsorLogos';

function StagePlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="page-section container m3-reveal">
      <div className="m3-card m3-card--forest" style={{ marginBlockEnd: '1.5rem' }}>
        <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.75rem' }}>
          <Icon name="medical_services" size={16} />
          CAMBLU · Medicina FURB
        </span>
        <h1 style={{ marginBlockEnd: '0.65rem' }}>{title}</h1>
        <p style={{ color: '#d7ece0' }}>{description}</p>
      </div>
      <SponsorsStrip />
    </section>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route
                  path="*"
                  element={
                    <StagePlaceholderPage
                      title="Portal CAMBLU em construção por etapas"
                      description="Fundação Material You Expressive, tokens de acessibilidade, documentação GitHub e componentes base inicializados."
                    />
                  }
                />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
