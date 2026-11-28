import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from './i18n/i18n';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ShopCartProvider } from './context/ShopCartContext';
import { Layout } from './components/Layout';
import { AccountMenuButton } from './components/AccountMenuButton';
import { RouteSeoManager } from './components/RouteSeoManager';
import { isEnrollmentRenewalNeeded } from './lib/memberCard';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutSpacesPage } from './pages/AboutSpacesPage';
import { MedfurbPage } from './pages/MedfurbPage';
import { InstituicoesPage } from './pages/InstituicoesPage';
import { LigasPage } from './pages/LigasPage';
import { GestoesPage } from './pages/GestoesPage';
import { ManualCalouroPage } from './pages/ManualCalouroPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { MyShopOrdersPage } from './pages/MyShopOrdersPage';
import { MyTicketsHistoryPage } from './pages/MyTicketsHistoryPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { SecimedPage } from './pages/SecimedPage';
import { AnaisSecimedPage } from './pages/AnaisSecimedPage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ClubPage } from './pages/ClubPage';
import { ClubPromotionPage } from './pages/ClubPromotionPage';
import { MemberCardPage } from './pages/MemberCardPage';
import { MemberCardValidationPage } from './pages/MemberCardValidationPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { CalendarPage } from './pages/CalendarPage';
import { EditaisPage } from './pages/EditaisPage';
import { DemandsPage } from './pages/DemandsPage';
import { CambluMulherPage } from './pages/CambluMulherPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { Icon } from './components/Icon';

const CertificatesPage = lazy(() =>
  import('./pages/CertificatesPage').then((m) => ({ default: m.CertificatesPage })),
);
const AdminBackPage = lazy(() =>
  import('./pages/AdminBackPage').then((m) => ({ default: m.AdminBackPage })),
);

function ProfileIncompleteBanner() {
  const { profile } = useAuth();
  if (!profile) return null;

  const needsProfileCompletion = !profile.profileCompleted;
  const needsEnrollmentRenewal = !needsProfileCompletion && isEnrollmentRenewalNeeded(profile);
  if (!needsProfileCompletion && !needsEnrollmentRenewal) return null;

  return (
    <div
      role="region"
      aria-label={
        needsProfileCompletion
          ? 'Aviso de cadastro incompleto'
          : 'Aviso de renovação do resumo de matrícula'
      }
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
          <Icon name={needsProfileCompletion ? 'badge' : 'upload_file'} size={19} />
          {needsProfileCompletion
            ? 'Complete seu cadastro (CPF, celular, vínculo FURB/turma e camiseta de calouro) para comprar e emitir certificados.'
            : 'O prazo da verificação da sua matrícula expirou neste semestre. Envie um novo resumo de matrícula (Medicina FURB) para manter o QR Code da sua carteirinha ativo.'}
        </span>
        <Link to="/perfil" className="m3-btn m3-btn--filled" style={{ minBlockSize: '36px', paddingBlock: '0.35rem' }}>
          {needsProfileCompletion ? 'Completar agora' : 'Enviar novo resumo'}
        </Link>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'auto' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <AppDataProvider>
            <ShopCartProvider>
              <BrowserRouter>
                <ScrollToTop />
                <RouteSeoManager />
                <Layout userSlot={<AccountMenuButton />}>
                <ProfileIncompleteBanner />
                <Suspense
                  fallback={
                    <section className="page-section container">
                      <div className="m3-card" aria-busy="true">
                        Carregando módulo...
                      </div>
                    </section>
                  }
                >
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                    <Route path="/sobre" element={<AboutSpacesPage />} />
                    <Route path="/espacos" element={<AboutSpacesPage />} />
                    <Route path="/medfurb" element={<MedfurbPage />} />
                    <Route path="/medfurb/instituicoes" element={<InstituicoesPage />} />
                    <Route path="/instituicoes" element={<Navigate to="/medfurb/instituicoes" replace />} />
                    <Route path="/ligas" element={<LigasPage />} />
                    <Route path="/gestoes" element={<GestoesPage />} />
                    <Route path="/manual-do-calouro" element={<ManualCalouroPage />} />
                    <Route path="/eventos" element={<EventsPage />} />
                    <Route path="/eventos/:slug" element={<EventDetailPage />} />
                    <Route path="/meus-ingressos" element={<MyTicketsPage />} />
                    <Route path="/meus-ingressos/historico" element={<MyTicketsHistoryPage />} />
                    <Route path="/meus-pedidos" element={<MyShopOrdersPage />} />
                    <Route path="/historico/ingressos" element={<Navigate to="/meus-ingressos/historico" replace />} />
                    <Route path="/historico/lojinha" element={<Navigate to="/meus-pedidos" replace />} />
                    <Route path="/certificados" element={<CertificatesPage />} />
                    <Route path="/certificados/validar" element={<CertificatesPage />} />
                    <Route path="/certificados/validar/:codigo" element={<CertificatesPage />} />
                    <Route path="/secimed" element={<SecimedPage />} />
                    <Route path="/secimed/anais-secimed" element={<AnaisSecimedPage />} />
                    <Route path="/lojinha" element={<ShopPage />} />
                    <Route path="/lojinha/:slug" element={<ProductDetailPage />} />
                    <Route path="/clube" element={<ClubPage />} />
                    <Route path="/clube/promocao/:promoId" element={<ClubPromotionPage />} />
                    <Route path="/clube/cartao" element={<MemberCardPage />} />
                    <Route path="/clube/cartao/validar" element={<MemberCardValidationPage />} />
                    <Route path="/clube/cartao/validar/:uid" element={<MemberCardValidationPage />} />
                    <Route path="/transparencia" element={<TransparencyPage />} />
                    <Route path="/calendario" element={<CalendarPage />} />
                    <Route path="/editais" element={<EditaisPage />} />
                    <Route path="/demandas" element={<DemandsPage />} />
                    <Route path="/camblu-mulher" element={<CambluMulherPage />} />
                    <Route path="/privacidade" element={<PrivacyPolicyPage />} />
                    <Route path="/politica-de-privacidade" element={<Navigate to="/privacidade" replace />} />
                    <Route path="/back/*" element={<AdminBackPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </BrowserRouter>
            </ShopCartProvider>
          </AppDataProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}

export default App;
