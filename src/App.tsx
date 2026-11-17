import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './i18n/i18n';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { Layout } from './components/Layout';
import { AccountMenuButton } from './components/AccountMenuButton';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutSpacesPage } from './pages/AboutSpacesPage';
import { MedfurbPage } from './pages/MedfurbPage';
import { LigasPage } from './pages/LigasPage';
import { GestoesPage } from './pages/GestoesPage';
import { ManualCalouroPage } from './pages/ManualCalouroPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { SecimedPage } from './pages/SecimedPage';
import { AnaisSecimedPage } from './pages/AnaisSecimedPage';
import { ShopPage } from './pages/ShopPage';
import { ClubPage } from './pages/ClubPage';
import { MemberCardPage } from './pages/MemberCardPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { CalendarPage } from './pages/CalendarPage';
import { EditaisPage } from './pages/EditaisPage';
import { DemandsPage } from './pages/DemandsPage';
import { CambluMulherPage } from './pages/CambluMulherPage';
import { Icon } from './components/Icon';
import { Link } from 'react-router-dom';

function ProfileIncompleteBanner() {
  const { profile } = useAuth();
  if (!profile || profile.profileCompleted) return null;
  return (
    <div
      role="region"
      aria-label="Aviso de cadastro incompleto"
      style={{
        background: 'var(--md-sys-color-secondary-container)',
        color: 'var(--md-sys-color-on-secondary-container)',
        borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <div
        className="container"
        style={{
          paddingBlock: '0.6rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontSize: '0.9rem',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
          <Icon name="badge" size={19} />
          Complete seu cadastro (CPF, celular, vínculo FURB/turma e camiseta de calouro) para comprar e emitir certificados.
        </span>
        <Link to="/perfil" className="m3-btn m3-btn--filled" style={{ minBlockSize: '36px', paddingBlock: '0.35rem' }}>
          Completar agora
        </Link>
      </div>
    </div>
  );
}

function UpcomingRoute({ title }: { title: string }) {
  return (
    <section className="page-section container m3-reveal">
      <div className="m3-card" style={{ maxInlineSize: '42rem', marginInline: 'auto' }}>
        <span className="m3-badge m3-badge--blue" style={{ marginBlockEnd: '0.65rem' }}>
          Próxima etapa do plano
        </span>
        <h1 className="m3-headline-medium" style={{ marginBlockEnd: '0.45rem' }}>
          {title}
        </h1>
        <p className="m3-body-medium">
          Módulo em implementação sequencial nas próximas etapas de desenvolvimento.
        </p>
      </div>
    </section>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <AppDataProvider>
              <BrowserRouter>
                <Layout userSlot={<AccountMenuButton />}>
                  <ProfileIncompleteBanner />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                    <Route path="/sobre" element={<AboutSpacesPage />} />
                    <Route path="/espacos" element={<AboutSpacesPage />} />
                    <Route path="/medfurb" element={<MedfurbPage />} />
                    <Route path="/ligas" element={<LigasPage />} />
                    <Route path="/gestoes" element={<GestoesPage />} />
                    <Route path="/manual-do-calouro" element={<ManualCalouroPage />} />
                    <Route path="/eventos" element={<EventsPage />} />
                    <Route path="/eventos/:slug" element={<EventDetailPage />} />
                    <Route path="/meus-ingressos" element={<MyTicketsPage />} />
                    <Route path="/certificados" element={<CertificatesPage />} />
                    <Route path="/certificados/validar" element={<CertificatesPage />} />
                    <Route path="/certificados/validar/:codigo" element={<CertificatesPage />} />
                    <Route path="/secimed" element={<SecimedPage />} />
                    <Route path="/secimed/anais-secimed" element={<AnaisSecimedPage />} />
                    <Route path="/lojinha" element={<ShopPage />} />
                    <Route path="/clube" element={<ClubPage />} />
                    <Route path="/clube/cartao" element={<MemberCardPage />} />
                    <Route path="/transparencia" element={<TransparencyPage />} />
                    <Route path="/calendario" element={<CalendarPage />} />
                    <Route path="/editais" element={<EditaisPage />} />
                    <Route path="/demandas" element={<DemandsPage />} />
                    <Route path="/camblu-mulher" element={<CambluMulherPage />} />
                    <Route path="/back" element={<UpcomingRoute title="Painel Administrativo (/back)" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </AppDataProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
