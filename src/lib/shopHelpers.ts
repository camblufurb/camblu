import logoClean from '../../assets/logos/logo_clean.png';
import type { ShopOrder, ShopProduct } from '../types/domain';

export function slugifyProductName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductSlug(product: Pick<ShopProduct, 'id' | 'slug' | 'name'>): string {
  return product.slug || product.id || slugifyProductName(product.name);
}

export function findProductBySlug(products: ShopProduct[], slug?: string): ShopProduct | undefined {
  if (!slug) return undefined;
  return products.find((p) => p.slug === slug || p.id === slug || getProductSlug(p) === slug);
}

export interface GallerySlide {
  id: string;
  label: string;
  caption: string;
  imageUrl?: string;
  gradient?: string;
  accentHex?: string;
  iconName?: string;
  showCrest?: boolean;
}

export function buildProductGallery(product: ShopProduct): GallerySlide[] {
  const realImages = (product.images || []).filter(Boolean);
  if (realImages.length > 0) {
    return realImages.map((imageUrl, idx) => ({
      id: `${product.id}-img-${idx}`,
      label: idx === 0 ? 'Visualização principal' : `Detalhe ${idx + 1}`,
      caption: idx === 0 ? product.name : `${product.name} — ângulo ${idx + 1}`,
      imageUrl,
    }));
  }

  const primaryHex = product.colors?.[0]?.hex || '#0f3325';
  const secondaryHex = product.colors?.[1]?.hex || '#edd16e';
  const icon =
    product.category === 'Camisetas' || product.category === 'Inverno' || product.category === 'Vestuário'
      ? 'checkroom'
      : product.category === 'Papelaria'
        ? 'edit_note'
        : product.category === 'Acessórios'
          ? 'water_bottle'
          : 'shopping_bag';

  return [
    {
      id: `${product.id}-view-1`,
      label: 'Frente Oficial',
      caption: `${product.name} — Arte oficial CAMBLU FURB`,
      gradient: `linear-gradient(145deg, ${primaryHex} 0%, #174936 62%, #071b13 100%)`,
      accentHex: secondaryHex,
      iconName: icon,
      showCrest: true,
    },
    {
      id: `${product.id}-view-2`,
      label: 'Acabamento & Brasão',
      caption: 'Bordado e gravação institucional Medicina FURB 1990',
      gradient: 'linear-gradient(135deg, #174936 0%, #0f3325 55%, #244b3b 100%)',
      accentHex: '#f1de97',
      iconName: 'verified',
      showCrest: true,
    },
    {
      id: `${product.id}-view-3`,
      label: 'Uso no Campus',
      caption: `Retirada sem frete na sala do CAMBLU — FURB Campus 1`,
      gradient: 'linear-gradient(135deg, #fbf3d5 0%, #edd16e 100%)',
      accentHex: '#0f3325',
      iconName: icon,
      showCrest: false,
    },
  ];
}

export { logoClean as CAMBLU_CLEAN_CREST_URL };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Seleciona os 4 produtos do mosaico do header da Lojinha:
 * 1º: mais novo; 2º e 3º: mais vendidos nos últimos 30 dias; 4º: menos vendido nos últimos 30 dias.
 */
export function selectHeroMosaicProducts(
  activeProducts: ShopProduct[],
  orders: ShopOrder[],
  nowMs = Date.now(),
): ShopProduct[] {
  if (activeProducts.length <= 1) return activeProducts;

  const cutoffMs = nowMs - THIRTY_DAYS_MS;
  const salesLastMonth = new Map<string, number>();
  for (const prod of activeProducts) {
    salesLastMonth.set(prod.id, 0);
  }

  for (const order of orders) {
    if (order.paymentStatus === 'pending') continue;
    const orderMs = Date.parse(order.createdAt);
    if (Number.isNaN(orderMs) || orderMs < cutoffMs) continue;
    for (const item of order.items || []) {
      if (salesLastMonth.has(item.productId)) {
        salesLastMonth.set(
          item.productId,
          (salesLastMonth.get(item.productId) || 0) + (item.quantity || 0),
        );
      }
    }
  }

  const sortedByNewest = [...activeProducts].sort((a, b) => {
    const aMs = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bMs = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bMs - aMs;
  });
  const newest = sortedByNewest[0];

  const remaining = activeProducts.filter((p) => p.id !== newest.id);
  const bySalesDesc = [...remaining].sort((a, b) => {
    const diff = (salesLastMonth.get(b.id) || 0) - (salesLastMonth.get(a.id) || 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'pt-BR');
  });

  const result: ShopProduct[] = [newest];
  if (bySalesDesc[0]) result.push(bySalesDesc[0]);
  if (bySalesDesc[1]) result.push(bySalesDesc[1]);

  const pickedIds = new Set(result.map((p) => p.id));
  const remainingForLeast = remaining.filter((p) => !pickedIds.has(p.id));
  if (remainingForLeast.length > 0) {
    const bySalesAsc = [...remainingForLeast].sort((a, b) => {
      const diff = (salesLastMonth.get(a.id) || 0) - (salesLastMonth.get(b.id) || 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'pt-BR');
    });
    result.push(bySalesAsc[0]);
  }

  return result.slice(0, 4);
}
