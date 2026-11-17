import logoClean from '../../assets/img/logo_clean.png';
import type { ShopProduct } from '../types/domain';

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
    product.category === 'Vestuário'
      ? 'checkroom'
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
