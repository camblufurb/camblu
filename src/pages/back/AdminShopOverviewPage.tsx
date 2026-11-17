import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useAppData } from '../../context/AppDataContext';
import { computeShopStats } from '../../lib/adminStats';
import { formatBrlFromCents } from '../../lib/validators';

export function AdminShopOverviewPage() {
  const { products, orders } = useAppData();
  const stats = useMemo(() => computeShopStats(products, orders), [products, orders]);

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Lojinha CAMBLU</h1>
        <p className="text-muted">
          Escolha uma área operacional da Lojinha para gerenciar estoque, catálogo de produtos ou entregas.
        </p>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Receita Líquida</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(stats.netRevenueCents)}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Produtos Ativos</span>
          <strong className="admin-kpi-value">{stats.activeProductsCount}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Estoque Total</span>
          <strong className="admin-kpi-value">{stats.totalStockUnits} un</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Entregas Pendentes</span>
          <strong className="admin-kpi-value">{stats.pendingDeliveries}</strong>
        </div>
      </div>

      <div className="grid-cards">
        <article className="m3-card m3-card--interactive" style={{ display: 'grid', gap: '0.85rem', alignContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <Icon name="inventory_2" size={28} className="m3-badge--blue" />
            <h2>Controle de Estoque</h2>
            <p className="text-muted">
              Ajuste quantidades por tamanho em tempo real e registre vendas presenciais (PIX/dinheiro) ou doações de calouros.
            </p>
          </div>
          <Link to="/back/lojinha/estoque" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
            <span>Abrir Estoque</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        </article>

        <article className="m3-card m3-card--interactive" style={{ display: 'grid', gap: '0.85rem', alignContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <Icon name="shopping_bag" size={28} className="m3-badge--blue" />
            <h2>Produtos</h2>
            <p className="text-muted">
              Cadastre novos produtos, edite descrições, preços, fotos e pause ou reative itens do catálogo.
            </p>
          </div>
          <Link to="/back/lojinha/produtos" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
            <span>Gerenciar Produtos ({products.length})</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        </article>

        <article className="m3-card m3-card--interactive" style={{ display: 'grid', gap: '0.85rem', alignContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <Icon name="local_shipping" size={28} className="m3-badge--blue" />
            <h2>Entregas</h2>
            <p className="text-muted">
              Confira pedidos aguardando retirada no campus, envie mensagem no WhatsApp e confirme entregas.
            </p>
          </div>
          <Link to="/back/lojinha/entregas" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
            <span>Checklist ({stats.pendingDeliveries} pendentes)</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        </article>

        <article className="m3-card m3-card--interactive" style={{ display: 'grid', gap: '0.85rem', alignContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <Icon name="receipt_long" size={28} className="m3-badge--blue" />
            <h2>Histórico de Compras</h2>
            <p className="text-muted">
              Consulte todos os pedidos pagos online, vendas presenciais, descontos Clube e doações registradas.
            </p>
          </div>
          <Link to="/back/lojinha/historico" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
            <span>Abrir Histórico ({stats.totalOrders})</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        </article>
      </div>

      {stats.lowStockVariants.length > 0 && (
        <article className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2>Alertas de Estoque Baixo</h2>
            <Link to="/back/lojinha/estoque" className="m3-btn m3-btn--text">
              Repor no estoque
            </Link>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.lowStockVariants.map((item) => (
              <span
                key={`${item.productId}-${item.size}`}
                className={`m3-badge ${item.stock === 0 ? 'm3-badge--error' : 'm3-badge--gold'}`}
              >
                {item.productName} · Tam {item.size}: {item.stock} un
              </span>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
