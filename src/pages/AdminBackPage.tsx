import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminEventShell } from '../components/admin/AdminEventShell';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminAnaisPage } from './back/AdminAnaisPage';
import { AdminClubPage } from './back/AdminClubPage';
import { AdminDashboardPage } from './back/AdminDashboardPage';
import { AdminDemandsPage } from './back/AdminDemandsPage';
import { AdminEditaisPage } from './back/AdminEditaisPage';
import { AdminEventCertificatesPage } from './back/AdminEventCertificatesPage';
import { AdminEventCreatePage } from './back/AdminEventCreatePage';
import { AdminEventLotsPage } from './back/AdminEventLotsPage';
import { AdminEventOverviewPage } from './back/AdminEventOverviewPage';
import { AdminEventParticipantsPage } from './back/AdminEventParticipantsPage';
import { AdminEventQrPage } from './back/AdminEventQrPage';
import { AdminEventsIndexPage } from './back/AdminEventsIndexPage';
import { AdminGestoesPage } from './back/AdminGestoesPage';
import { AdminLigasPage } from './back/AdminLigasPage';
import { AdminQrLauncherPage } from './back/AdminQrLauncherPage';
import { AdminShopDeliveriesPage } from './back/AdminShopDeliveriesPage';
import { AdminShopOrdersHistoryPage } from './back/AdminShopOrdersHistoryPage';
import { AdminShopOverviewPage } from './back/AdminShopOverviewPage';
import { AdminShopProductsPage } from './back/AdminShopProductsPage';
import { AdminShopStockPage } from './back/AdminShopStockPage';
import { AdminTicketPurchasesHistoryPage } from './back/AdminTicketPurchasesHistoryPage';
import { AdminTransparencyFinancePage } from './back/AdminTransparencyFinancePage';
import { AdminTransparencyPostsPage } from './back/AdminTransparencyPostsPage';

export function AdminBackPage() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="lojinha" element={<AdminShopOverviewPage />} />
        <Route path="lojinha/estoque" element={<AdminShopStockPage />} />
        <Route path="lojinha/produtos" element={<AdminShopProductsPage />} />
        <Route path="lojinha/entregas" element={<AdminShopDeliveriesPage />} />
        <Route path="lojinha/historico" element={<AdminShopOrdersHistoryPage />} />
        <Route path="clube" element={<AdminClubPage />} />
        <Route path="eventos" element={<AdminEventsIndexPage />} />
        <Route path="eventos/novo" element={<AdminEventCreatePage />} />
        <Route path="eventos/historico" element={<AdminTicketPurchasesHistoryPage />} />
        <Route path="qr" element={<AdminQrLauncherPage />} />
        <Route path="eventos/:eventId" element={<AdminEventShell />}>
          <Route index element={<AdminEventOverviewPage />} />
          <Route path="lotes" element={<AdminEventLotsPage />} />
          <Route path="participantes" element={<AdminEventParticipantsPage />} />
          <Route path="certificados" element={<AdminEventCertificatesPage />} />
          <Route path="qr" element={<AdminEventQrPage />} />
        </Route>
        <Route path="transparencia" element={<AdminTransparencyFinancePage />} />
        <Route path="transparencia/posts" element={<AdminTransparencyPostsPage />} />
        <Route path="gestoes" element={<AdminGestoesPage />} />
        <Route path="editais" element={<AdminEditaisPage />} />
        <Route path="anais" element={<AdminAnaisPage />} />
        <Route path="ligas" element={<AdminLigasPage />} />
        <Route path="demandas" element={<AdminDemandsPage />} />
        <Route path="*" element={<Navigate to="/back" replace />} />
      </Route>
    </Routes>
  );
}
