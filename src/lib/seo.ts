import type { CambluEvent, ShopProduct } from '../types/domain';
import { findProductBySlug, getProductSlug } from './shopHelpers';

export interface SeoMetaPayload {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  ogType?: 'website' | 'article' | 'product';
  robots: 'index, follow' | 'noindex, nofollow';
  jsonLd?: Record<string, unknown>;
}

export interface StaticRouteSeoEntry {
  path: string;
  title: string;
  description: string;
  indexable: boolean;
}

export const PUBLIC_ROUTE_SEO_LIST: StaticRouteSeoEntry[] = [
  {
    path: '/',
    title: 'CAMBLU — Centro Acadêmico de Medicina de Blumenau | FURB',
    description:
      'Portal oficial do CAMBLU (Centro Acadêmico de Medicina de Blumenau - FURB): eventos, ingressos, certificados, Lojinha Oficial, Clube CAMBLU, Transparência, SECIMED e Manual do Calouro.',
    indexable: true,
  },
  {
    path: '/secimed',
    title: 'SECIMED — Semana Científica de Medicina FURB | CAMBLU',
    description:
      'Confira a programação científica, palestras, workshops, submissões de trabalhos e anais da SECIMED — Semana Científica de Medicina da FURB.',
    indexable: true,
  },
  {
    path: '/secimed/anais-secimed',
    title: 'Anais da SECIMED (ISSN 3086-612X) | CAMBLU Medicina FURB',
    description:
      'Acesse as edições publicadas, volumes e trabalhos científicos apresentados nos Anais da Semana Científica de Medicina da FURB (ISSN 3086-612X).',
    indexable: true,
  },
  {
    path: '/eventos',
    title: 'Eventos e Ingressos | CAMBLU Medicina FURB',
    description:
      'Simpósios, congressos, eventos científicos e integrações acadêmicas da Medicina FURB com inscrição online e desconto exclusivo do Clube CAMBLU.',
    indexable: true,
  },
  {
    path: '/lojinha',
    title: 'Lojinha Oficial CAMBLU | Produtos Medicina FURB',
    description:
      'Vestuário, moletons, camisetas, jalecos e acessórios oficiais da Medicina FURB com 10% de desconto automático para assinantes do Clube CAMBLU.',
    indexable: true,
  },
  {
    path: '/clube',
    title: 'Clube CAMBLU — Assinaturas e Benefícios | Medicina FURB',
    description:
      'Escolha seu plano no Clube CAMBLU (Comum, Raro, Épico ou Lendário): Carteirinha de Estudante digital a partir do Comum, descontos na Lojinha, eventos gratuitos e SECIMED.',
    indexable: true,
  },
  {
    path: '/ligas',
    title: 'Ligas Acadêmicas | CAMBLU Medicina FURB',
    description:
      'Diretório oficial das Ligas Acadêmicas de Medicina da FURB: áreas de atuação, coordenações, eventos e canais de contato.',
    indexable: true,
  },
  {
    path: '/gestoes',
    title: 'Gestões Históricas do CAMBLU (Desde 1990) | Medicina FURB',
    description:
      'Conheça as diretorias, membros e conquistas históricas do Centro Acadêmico de Medicina de Blumenau (CAMBLU — FURB) desde 1990.',
    indexable: true,
  },
  {
    path: '/medfurb',
    title: 'MEDFURB — O Curso de Medicina da FURB | CAMBLU',
    description:
      'Estrutura do curso de Medicina da FURB em Blumenau, acreditação SAEME, internato, matriz curricular, estágios e pesquisa discente.',
    indexable: true,
  },
  {
    path: '/medfurb/instituicoes',
    title: 'Instituições Estudantis | CAMBLU, DCE FURB, AAARIH e IFMSA Brazil',
    description:
      'Conheça as entidades estudantis representativas da Medicina FURB: CAMBLU, DCE FURB, Atlética AAARIH e IFMSA Brazil FURB.',
    indexable: true,
  },
  {
    path: '/manual-do-calouro',
    title: 'Manual do Calouro MEDFURB | CAMBLU',
    description:
      'Guia completo para calouros e ingressantes de Medicina da FURB: matrícula, campus, ligas, benefícios do Clube CAMBLU e vida universitária em Blumenau.',
    indexable: true,
  },
  {
    path: '/calendario',
    title: 'Calendário Acadêmico | CAMBLU Medicina FURB',
    description:
      'Acompanhe as datas oficiais de eventos, simpósios científicos, assembleias e programações do CAMBLU e da Medicina FURB.',
    indexable: true,
  },
  {
    path: '/editais',
    title: 'Editais Oficiais e Documentos | CAMBLU Medicina FURB',
    description:
      'Editais, chamadas públicas, estatuto, eleições e documentos oficiais divulgados pelo Centro Acadêmico de Medicina de Blumenau.',
    indexable: true,
  },
  {
    path: '/transparencia',
    title: 'Portal da Transparência | CAMBLU Medicina FURB',
    description:
      'Prestação de contas pública, movimentações financeiras e atas de reuniões do CAMBLU — Medicina FURB.',
    indexable: true,
  },
  {
    path: '/sobre',
    title: 'Sobre o CAMBLU & Espaços na FURB | Medicina FURB',
    description:
      'História, missão institucional e espaços de convivência e estudo do Centro Acadêmico de Medicina de Blumenau no campus da FURB.',
    indexable: true,
  },
  {
    path: '/espacos',
    title: 'Espaços do CAMBLU na FURB | Medicina FURB',
    description:
      'Conheça a sede, salas de estudo e espaços administrados pelo CAMBLU para os acadêmicos de Medicina da FURB.',
    indexable: false,
  },
  {
    path: '/demandas',
    title: 'Demandas & Ouvidoria Discente | CAMBLU',
    description:
      'Canal oficial para envio de solicitações de turma, dúvidas, sugestões ou demandas acadêmicas à diretoria do CAMBLU, com opção anônima.',
    indexable: true,
  },
  {
    path: '/camblu-mulher',
    title: 'CAMBLU Mulher — Acolhimento e Representatividade | Medicina FURB',
    description:
      'Coletivo feminino do CAMBLU dedicado ao acolhimento, suporte e encaminhamento seguro e sigiloso de demandas das estudantes da MEDFURB.',
    indexable: true,
  },
  {
    path: '/certificados',
    title: 'Certificados de Eventos | CAMBLU Medicina FURB',
    description:
      'Emita e baixe seus certificados de participação com carga horária para AACCs e valide códigos oficiais emitidos pelo CAMBLU.',
    indexable: true,
  },
  {
    path: '/privacidade',
    title: 'Política de Privacidade (LGPD) | CAMBLU Medicina FURB',
    description:
      'Saiba como o portal do CAMBLU coleta, protege e utiliza informações acadêmicas e cadastrais em conformidade com a LGPD.',
    indexable: true,
  },
];

const NON_INDEXABLE_PREFIXES: Array<{ prefix: string; title: string; description: string }> = [
  {
    prefix: '/clube/cartao/validar',
    title: 'Validação Pública de Carteirinha de Estudante | CAMBLU FURB',
    description:
      'Verificação em tempo real de autenticidade da Carteirinha de Estudante digital do Clube CAMBLU (Medicina FURB).',
  },
  {
    prefix: '/clube/cartao',
    title: 'Carteirinha de Estudante Digital | Clube CAMBLU',
    description:
      'Carteirinha de Estudante Digital interativa do Clube CAMBLU (Medicina FURB) com QR Code de autenticidade.',
  },
  {
    prefix: '/certificados/validar',
    title: 'Validação Pública de Certificado | CAMBLU Medicina FURB',
    description:
      'Verifique a autenticidade, titularidade e carga horária de certificados emitidos pelo Centro Acadêmico de Medicina de Blumenau.',
  },
  {
    prefix: '/perfil',
    title: 'Meu Perfil Acadêmico | CAMBLU',
    description: 'Gerencie seus dados cadastrais, CPF, vínculo FURB e turma no Portal CAMBLU.',
  },
  {
    prefix: '/meus-ingressos',
    title: 'Meus Ingressos | CAMBLU Eventos',
    description: 'Consulte seus QR Codes de acesso e histórico de ingressos no CAMBLU.',
  },
  {
    prefix: '/meus-pedidos',
    title: 'Meus Pedidos da Lojinha | CAMBLU',
    description: 'Acompanhe seus pedidos e retiradas na Lojinha Oficial CAMBLU.',
  },
  {
    prefix: '/back',
    title: 'Painel Administrativo | CAMBLU',
    description: 'Área restrita à diretoria gestora do CAMBLU.',
  },
];

export function normalizePathname(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean || '/';
}

export function absolutizeMediaUrl(rawUrl: string | undefined | null, siteOrigin: string): string | undefined {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || trimmed.startsWith('data:')) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${siteOrigin.replace(/\/+$/, '')}${trimmed}`;
  return `${siteOrigin.replace(/\/+$/, '')}/${trimmed}`;
}

export function buildOrganizationJsonLd(siteOrigin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'CAMBLU — Centro Acadêmico de Medicina de Blumenau',
    alternateName: 'CAMBLU MEDFURB',
    url: siteOrigin,
    logo: `${siteOrigin}/logo-camblu.png`,
    foundingDate: '1990',
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'FURB — Universidade Regional de Blumenau',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Blumenau',
      addressRegion: 'SC',
      addressCountry: 'BR',
    },
  };
}

export function resolveEventSeoMeta(
  event: CambluEvent,
  slug: string,
  siteOrigin: string,
): SeoMetaPayload {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const title = `${event.title} | CAMBLU Eventos`;
  const description = String(
    event.description || 'Confira programação, lotes, ingressos e certificação oficial no portal do CAMBLU.',
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
  const resolvedImg = absolutizeMediaUrl(event.imageUrl, cleanOrigin);
  const imageUrl = resolvedImg || `${cleanOrigin}/og-cover.png`;
  const canonicalUrl = `${cleanOrigin}/eventos/${encodeURIComponent(event.slug || slug)}`;

  const attendanceMode =
    event.mode === 'virtual'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : event.mode === 'misto'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode';

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt: event.title,
    ...(resolvedImg ? {} : { imageWidth: 1200, imageHeight: 630 }),
    ogType: 'website',
    robots: event.published ? 'index, follow' : 'noindex, nofollow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description,
      startDate: event.startAt || undefined,
      endDate: event.endAt || undefined,
      eventAttendanceMode: attendanceMode,
      eventStatus: 'https://schema.org/EventScheduled',
      location: event.locationShort
        ? { '@type': 'Place', name: event.locationShort, address: 'Blumenau, SC' }
        : undefined,
      image: [imageUrl],
      organizer: { '@type': 'Organization', name: 'CAMBLU — Medicina FURB', url: cleanOrigin },
      url: canonicalUrl,
    },
  };
}

export function resolveProductSeoMeta(
  product: ShopProduct,
  slug: string,
  siteOrigin: string,
): SeoMetaPayload {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const title = `${product.name} | Lojinha CAMBLU`;
  const description = String(
    product.description || 'Produto oficial da Medicina FURB disponível na Lojinha CAMBLU com benefícios do Clube.',
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
  const firstRawImg = (product.images || []).find(Boolean);
  const resolvedImg = absolutizeMediaUrl(firstRawImg, cleanOrigin);
  const imageUrl = resolvedImg || `${cleanOrigin}/og-cover.png`;
  const canonicalUrl = `${cleanOrigin}/lojinha/${encodeURIComponent(getProductSlug(product) || slug)}`;
  const hasStock = (product.sizes || []).some((s) => s.stock > 0);

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt: product.name,
    ...(resolvedImg ? {} : { imageWidth: 1200, imageHeight: 630 }),
    ogType: 'product',
    robots: product.active ? 'index, follow' : 'noindex, nofollow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      category: product.category || undefined,
      image: [imageUrl],
      brand: { '@type': 'Brand', name: 'CAMBLU Medicina FURB' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: (product.priceCents / 100).toFixed(2),
        availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: canonicalUrl,
      },
    },
  };
}

export function resolveRouteSeo(
  pathname: string,
  siteOrigin: string,
  catalog?: { events?: CambluEvent[]; products?: ShopProduct[] },
): SeoMetaPayload {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const normalizedPath = normalizePathname(pathname);
  const defaultImage = `${cleanOrigin}/og-cover.png`;

  const eventMatch = normalizedPath.match(/^\/eventos\/([^/]+)$/);
  if (eventMatch?.[1] && catalog?.events) {
    const slug = decodeURIComponent(eventMatch[1]);
    const ev = catalog.events.find((item) => item.slug === slug || item.id === slug);
    if (ev) return resolveEventSeoMeta(ev, slug, cleanOrigin);
  }

  const productMatch = normalizedPath.match(/^\/lojinha\/([^/]+)$/);
  if (productMatch?.[1] && catalog?.products) {
    const slug = decodeURIComponent(productMatch[1]);
    const product = findProductBySlug(catalog.products, slug);
    if (product) return resolveProductSeoMeta(product, slug, cleanOrigin);
  }

  const canonicalUrl = normalizedPath === '/' ? `${cleanOrigin}/` : `${cleanOrigin}${normalizedPath}`;
  const privateMatch = NON_INDEXABLE_PREFIXES.find(
    (entry) => normalizedPath === entry.prefix || normalizedPath.startsWith(`${entry.prefix}/`),
  );
  if (privateMatch) {
    return {
      title: privateMatch.title,
      description: privateMatch.description,
      canonicalUrl,
      imageUrl: defaultImage,
      imageAlt: 'CAMBLU — Centro Acadêmico de Medicina de Blumenau (FURB)',
      imageWidth: 1200,
      imageHeight: 630,
      ogType: 'website',
      robots: 'noindex, nofollow',
    };
  }

  const staticEntry =
    PUBLIC_ROUTE_SEO_LIST.find((entry) => entry.path === normalizedPath) || PUBLIC_ROUTE_SEO_LIST[0];

  const jsonLd =
    normalizedPath === '/'
      ? buildOrganizationJsonLd(cleanOrigin)
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: staticEntry.title,
          description: staticEntry.description,
          url: canonicalUrl,
          inLanguage: 'pt-BR',
          isPartOf: { '@type': 'WebSite', name: 'CAMBLU — Medicina FURB', url: cleanOrigin },
        };

  return {
    title: staticEntry.title,
    description: staticEntry.description,
    canonicalUrl: normalizedPath === staticEntry.path ? canonicalUrl : `${cleanOrigin}/`,
    imageUrl: defaultImage,
    imageAlt: 'CAMBLU — Centro Acadêmico de Medicina de Blumenau (FURB)',
    imageWidth: 1200,
    imageHeight: 630,
    ogType: 'website',
    robots: staticEntry.indexable ? 'index, follow' : 'noindex, nofollow',
    jsonLd,
  };
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function removeMeta(attr: 'name' | 'property', key: string) {
  const el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (el) el.remove();
}

export function applyDocumentSeo(meta: SeoMetaPayload) {
  if (typeof document === 'undefined') return;
  document.title = meta.title;

  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', meta.robots);

  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = meta.canonicalUrl;

  upsertMeta('property', 'og:type', meta.ogType || 'website');
  upsertMeta('property', 'og:site_name', 'CAMBLU — Medicina FURB');
  upsertMeta('property', 'og:locale', 'pt_BR');
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', meta.canonicalUrl);
  upsertMeta('property', 'og:image', meta.imageUrl);
  upsertMeta('property', 'og:image:alt', meta.imageAlt);

  if (meta.imageWidth && meta.imageHeight) {
    upsertMeta('property', 'og:image:width', String(meta.imageWidth));
    upsertMeta('property', 'og:image:height', String(meta.imageHeight));
  } else {
    removeMeta('property', 'og:image:width');
    removeMeta('property', 'og:image:height');
  }

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', meta.imageUrl);
  upsertMeta('name', 'twitter:image:alt', meta.imageAlt);

  const ldId = 'camblu-structured-data';
  let scriptEl = document.getElementById(ldId) as HTMLScriptElement | null;
  if (meta.jsonLd) {
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = ldId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(meta.jsonLd);
  } else if (scriptEl) {
    scriptEl.remove();
  }
}
