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
  priority: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  indexable: boolean;
}

export const PUBLIC_ROUTE_SEO_LIST: StaticRouteSeoEntry[] = [
  {
    path: '/',
    title: 'CAMBLU — Centro Acadêmico de Medicina de Blumenau | FURB',
    description:
      'Portal oficial do CAMBLU (Centro Acadêmico de Medicina de Blumenau - FURB): eventos, ingressos, certificados, Lojinha Oficial, Clube CAMBLU, Transparência, SECIMED e Manual do Calouro.',
    priority: '1.0',
    changefreq: 'daily',
    indexable: true,
  },
  {
    path: '/secimed',
    title: 'SECIMED — Semana Científica de Medicina FURB | CAMBLU',
    description:
      'Confira a programação científica, palestras, workshops, submissões de trabalhos e anais da SECIMED — Semana Científica de Medicina da FURB.',
    priority: '0.9',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/secimed/anais-secimed',
    title: 'Anais da SECIMED (ISSN 3086-612X) | CAMBLU Medicina FURB',
    description:
      'Acesse as edições publicadas, volumes e trabalhos científicos apresentados nos Anais da Semana Científica de Medicina da FURB (ISSN 3086-612X).',
    priority: '0.8',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/eventos',
    title: 'Eventos e Ingressos | CAMBLU Medicina FURB',
    description:
      'Simpósios, congressos, eventos científicos e integrações acadêmicas da Medicina FURB com inscrição online e desconto exclusivo do Clube CAMBLU.',
    priority: '0.9',
    changefreq: 'daily',
    indexable: true,
  },
  {
    path: '/lojinha',
    title: 'Lojinha Oficial CAMBLU | Produtos Medicina FURB',
    description:
      'Vestuário, moletons, camisetas, jalecos e acessórios oficiais da Medicina FURB com 10% de desconto automático para assinantes do Clube CAMBLU.',
    priority: '0.9',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/clube',
    title: 'Clube CAMBLU — Assinaturas e Benefícios | Medicina FURB',
    description:
      'Escolha seu plano no Clube CAMBLU (Comum, Raro, Épico ou Lendário): Carteirinha de Estudante digital a partir do Comum, descontos na Lojinha, eventos gratuitos e SECIMED.',
    priority: '0.9',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/ligas',
    title: 'Ligas Acadêmicas | CAMBLU Medicina FURB',
    description:
      'Diretório oficial das Ligas Acadêmicas de Medicina da FURB: áreas de atuação, coordenações, eventos e canais de contato.',
    priority: '0.8',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/gestoes',
    title: 'Gestões Históricas do CAMBLU (Desde 1990) | Medicina FURB',
    description:
      'Conheça as diretorias, membros e conquistas históricas do Centro Acadêmico de Medicina de Blumenau (CAMBLU — FURB) desde 1990.',
    priority: '0.8',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/medfurb',
    title: 'MEDFURB — O Curso de Medicina da FURB | CAMBLU',
    description:
      'Estrutura do curso de Medicina da FURB em Blumenau, acreditação SAEME, internato, matriz curricular, estágios e pesquisa discente.',
    priority: '0.8',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/medfurb/instituicoes',
    title: 'Instituições Estudantis | CAMBLU, DCE FURB, AAARIH e IFMSA Brazil',
    description:
      'Conheça as entidades estudantis representativas da Medicina FURB: CAMBLU, DCE FURB, Atlética AAARIH e IFMSA Brazil FURB.',
    priority: '0.7',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/manual-do-calouro',
    title: 'Manual do Calouro MEDFURB | CAMBLU',
    description:
      'Guia completo para calouros e ingressantes de Medicina da FURB: matrícula, campus, ligas, benefícios do Clube CAMBLU e vida universitária em Blumenau.',
    priority: '0.8',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/calendario',
    title: 'Calendário Acadêmico | CAMBLU Medicina FURB',
    description:
      'Acompanhe as datas oficiais de eventos, simpósios científicos, assembleias e programações do CAMBLU e da Medicina FURB.',
    priority: '0.8',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/editais',
    title: 'Editais Oficiais e Documentos | CAMBLU Medicina FURB',
    description:
      'Editais, chamadas públicas, estatuto, eleições e documentos oficiais divulgados pelo Centro Acadêmico de Medicina de Blumenau.',
    priority: '0.8',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/transparencia',
    title: 'Portal da Transparência | CAMBLU Medicina FURB',
    description:
      'Prestação de contas pública, movimentações financeiras e atas de reuniões do CAMBLU — Medicina FURB.',
    priority: '0.7',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/sobre',
    title: 'Sobre o CAMBLU & Espaços na FURB | Medicina FURB',
    description:
      'História, missão institucional e espaços de convivência e estudo do Centro Acadêmico de Medicina de Blumenau no campus da FURB.',
    priority: '0.7',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/espacos',
    title: 'Espaços do CAMBLU na FURB | Medicina FURB',
    description:
      'Conheça a sede, salas de estudo e espaços administrados pelo CAMBLU para os acadêmicos de Medicina da FURB.',
    priority: '0.6',
    changefreq: 'monthly',
    indexable: false,
  },
  {
    path: '/demandas',
    title: 'Demandas & Ouvidoria Discente | CAMBLU',
    description:
      'Canal oficial para envio de solicitações de turma, dúvidas, sugestões ou demandas acadêmicas à diretoria do CAMBLU, com opção anônima.',
    priority: '0.7',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/camblu-mulher',
    title: 'CAMBLU Mulher — Acolhimento e Representatividade | Medicina FURB',
    description:
      'Coletivo feminino do CAMBLU dedicado ao acolhimento, suporte e encaminhamento seguro e sigiloso de demandas das estudantes da MEDFURB.',
    priority: '0.7',
    changefreq: 'monthly',
    indexable: true,
  },
  {
    path: '/certificados',
    title: 'Certificados de Eventos | CAMBLU Medicina FURB',
    description:
      'Emita e baixe seus certificados de participação com carga horária para AACCs e valide códigos oficiais emitidos pelo CAMBLU.',
    priority: '0.7',
    changefreq: 'weekly',
    indexable: true,
  },
  {
    path: '/privacidade',
    title: 'Política de Privacidade (LGPD) | CAMBLU Medicina FURB',
    description:
      'Saiba como o portal do CAMBLU coleta, protege e utiliza informações acadêmicas e cadastrais em conformidade com a LGPD.',
    priority: '0.4',
    changefreq: 'monthly',
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

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

export function resolveStaticRouteSeo(pathname: string, siteOrigin: string): SeoMetaPayload {
  const normalizedPath = normalizePathname(pathname);
  const canonicalUrl = normalizedPath === '/' ? `${siteOrigin}/` : `${siteOrigin}${normalizedPath}`;
  const defaultImage = `${siteOrigin}/og-cover.png`;

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
    PUBLIC_ROUTE_SEO_LIST.find((entry) => entry.path === normalizedPath) ||
    PUBLIC_ROUTE_SEO_LIST[0];

  const jsonLd =
    normalizedPath === '/'
      ? buildOrganizationJsonLd(siteOrigin)
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: staticEntry.title,
          description: staticEntry.description,
          url: canonicalUrl,
          inLanguage: 'pt-BR',
          isPartOf: {
            '@type': 'WebSite',
            name: 'CAMBLU — Medicina FURB',
            url: siteOrigin,
          },
        };

  return {
    title: staticEntry.title,
    description: staticEntry.description,
    canonicalUrl: normalizedPath === staticEntry.path ? canonicalUrl : `${siteOrigin}/`,
    imageUrl: defaultImage,
    imageAlt: 'CAMBLU — Centro Acadêmico de Medicina de Blumenau (FURB)',
    imageWidth: 1200,
    imageHeight: 630,
    ogType: 'website',
    robots: staticEntry.indexable ? 'index, follow' : 'noindex, nofollow',
    jsonLd,
  };
}

export function buildEventSeoMeta(
  ev: {
    title?: string;
    description?: string;
    imageUrl?: string;
    startAt?: string;
    endAt?: string;
    locationShort?: string;
    location?: string;
    mode?: string;
    published?: boolean;
  },
  slug: string,
  siteOrigin: string,
): SeoMetaPayload {
  const title = ev.title ? `${ev.title} | CAMBLU Eventos` : 'CAMBLU — Eventos Medicina FURB';
  const description = String(
    ev.description || 'Confira programação, lotes, ingressos e certificação oficial no portal do CAMBLU.',
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
  const resolvedImg = absolutizeMediaUrl(ev.imageUrl, siteOrigin);
  const imageUrl = resolvedImg || `${siteOrigin}/og-cover.png`;
  const canonicalUrl = `${siteOrigin}/eventos/${encodeURIComponent(slug)}`;
  const venue = ev.locationShort || ev.location;
  const attendanceMode =
    ev.mode === 'virtual'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : ev.mode === 'misto'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode';

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt: ev.title || 'Evento CAMBLU Medicina FURB',
    ...(resolvedImg ? {} : { imageWidth: 1200, imageHeight: 630 }),
    ogType: 'website',
    robots: ev.published === false ? 'noindex, nofollow' : 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: ev.title || 'Evento CAMBLU',
      description,
      startDate: ev.startAt || undefined,
      endDate: ev.endAt || undefined,
      eventAttendanceMode: attendanceMode,
      eventStatus: 'https://schema.org/EventScheduled',
      location: venue
        ? {
            '@type': 'Place',
            name: venue,
            address: 'Blumenau, SC',
          }
        : undefined,
      image: [imageUrl],
      organizer: {
        '@type': 'Organization',
        name: 'CAMBLU — Medicina FURB',
        url: siteOrigin,
      },
      url: canonicalUrl,
    },
  };
}

export function buildProductSeoMeta(
  product: {
    name?: string;
    description?: string;
    category?: string;
    images?: string[];
    priceCents?: number;
    active?: boolean;
    sizes?: Array<{ stock: number }>;
  },
  slug: string,
  siteOrigin: string,
): SeoMetaPayload {
  const title = product.name ? `${product.name} | Lojinha CAMBLU` : 'Lojinha Oficial CAMBLU | Medicina FURB';
  const description = String(
    product.description || 'Produto oficial da Medicina FURB disponível na Lojinha CAMBLU com benefícios do Clube.',
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
  const firstRawImg = (product.images || []).find(Boolean);
  const resolvedImg = absolutizeMediaUrl(firstRawImg, siteOrigin);
  const imageUrl = resolvedImg || `${siteOrigin}/og-cover.png`;
  const canonicalUrl = `${siteOrigin}/lojinha/${encodeURIComponent(slug)}`;
  const hasStock = (product.sizes || []).some((s) => s.stock > 0);
  const priceBrl = typeof product.priceCents === 'number' ? (product.priceCents / 100).toFixed(2) : undefined;

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt: product.name || 'Produto Lojinha Oficial CAMBLU',
    ...(resolvedImg ? {} : { imageWidth: 1200, imageHeight: 630 }),
    ogType: 'product',
    robots: product.active === false ? 'noindex, nofollow' : 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name || 'Produto Lojinha CAMBLU',
      description,
      category: product.category || undefined,
      image: [imageUrl],
      brand: {
        '@type': 'Brand',
        name: 'CAMBLU Medicina FURB',
      },
      offers: priceBrl
        ? {
            '@type': 'Offer',
            priceCurrency: 'BRL',
            price: priceBrl,
            availability: hasStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: canonicalUrl,
          }
        : undefined,
    },
  };
}

export function renderSeoHeadTags(meta: SeoMetaPayload): string {
  const dimensions =
    meta.imageWidth && meta.imageHeight
      ? `\n    <meta property="og:image:width" content="${meta.imageWidth}" />\n    <meta property="og:image:height" content="${meta.imageHeight}" />`
      : '';

  const safeJsonLd = meta.jsonLd
    ? `\n    <script id="camblu-structured-data" type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';

  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(meta.description)}" />`,
    `    <meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    `    <link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`,
    `    <meta property="og:type" content="${escapeHtml(meta.ogType || 'website')}" />`,
    `    <meta property="og:site_name" content="CAMBLU — Medicina FURB" />`,
    `    <meta property="og:locale" content="pt_BR" />`,
    `    <meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />`,
    `    <meta property="og:image" content="${escapeHtml(meta.imageUrl)}" />`,
    `    <meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />${dimensions}`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}" />`,
    `    <meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />${safeJsonLd}`,
  ].join('\n');
}

export function injectSeoIntoHtml(indexHtml: string, meta: SeoMetaPayload): string {
  const cleaned = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*\/?>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*\/?>\s*/gi, '')
    .replace(/<script\s+id=["']camblu-structured-data["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

  const tags = renderSeoHeadTags(meta);
  if (/<head[^>]*>/i.test(cleaned)) {
    return cleaned.replace(/<head([^>]*)>/i, `<head$1>\n    ${tags}`);
  }
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />${tags}</head>${cleaned}</html>`;
}
