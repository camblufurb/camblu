import type {
  AnaisEdition,
  CambluEvent,
  EditalItem,
  ShopOrder,
  ShopProduct,
} from '../types/domain';

export const EVENTS_SEED: CambluEvent[] = [
  {
    id: 'evt-xxiii-secimed',
    slug: 'xxiii-secimed-2026',
    title: 'XXIII SECIMED — Semana Científica de Medicina FURB',
    description:
      'O maior evento científico da Medicina FURB desde 2002. Cinco dias de palestras magnas, mesas-redondas, apresentação de trabalhos científicos, coffee breaks e workshops práticos das Ligas Acadêmicas com certificação integrada por QR Code.',
    imageUrl: '',
    maxCapacity: 320,
    mode: 'presencial',
    locationShort: 'Auditório Bloco J & Salas CCS — FURB Campus 1',
    mapsUrl: 'https://maps.google.com/?q=FURB+Blumenau+Campus+1',
    category: 'secimed',
    isSecimed: true,
    hasCoffee: true,
    secimedPalette: {
      primary: '#5f2841',
      secondary1: '#dc8987',
      secondary2: '#a0af6c',
      background: '#f2efe6',
    },
    startAt: '2026-10-19T18:30:00-03:00',
    endAt: '2026-10-23T22:00:00-03:00',
    published: true,
    createdAt: '2026-08-01T12:00:00.000Z',
    lots: [
      {
        id: 'lot-secimed-1',
        name: '1º Lote Acadêmicos FURB',
        priceCents: 6500,
        totalQuantity: 150,
        soldQuantity: 112,
        qrCodesPerTicket: 3,
        active: true,
        qrDefinitions: [
          {
            id: 'qr-abertura',
            label: 'Abertura & Palestras Dia 1',
            dateTime: '2026-10-19T19:00:00-03:00',
            certificateHours: 4,
          },
          {
            id: 'qr-workshops',
            label: 'Workshops das Ligas Acadêmicas',
            dateTime: '2026-10-21T14:00:00-03:00',
            certificateHours: 6,
          },
          {
            id: 'qr-encerramento',
            label: 'Apresentações Orais & Encerramento',
            dateTime: '2026-10-23T19:00:00-03:00',
            certificateHours: 5,
          },
        ],
      },
      {
        id: 'lot-secimed-ext',
        name: 'Lote Externo / Profissionais',
        priceCents: 9500,
        totalQuantity: 80,
        soldQuantity: 24,
        qrCodesPerTicket: 3,
        active: true,
        qrDefinitions: [
          {
            id: 'qr-abertura-ext',
            label: 'Abertura & Palestras Dia 1',
            dateTime: '2026-10-19T19:00:00-03:00',
            certificateHours: 4,
          },
          {
            id: 'qr-workshops-ext',
            label: 'Workshops das Ligas Acadêmicas',
            dateTime: '2026-10-21T14:00:00-03:00',
            certificateHours: 6,
          },
          {
            id: 'qr-encerramento-ext',
            label: 'Apresentações Orais & Encerramento',
            dateTime: '2026-10-23T19:00:00-03:00',
            certificateHours: 5,
          },
        ],
      },
    ],
  },
  {
    id: 'evt-simposio-coffee',
    slug: 'simposio-emergencias-clinicas-coffee',
    title: 'Simpósio CAMBLU de Emergências Clínicas + Coffee Break',
    description:
      'Discussão interativa de casos reais de pronto-socorro conduzida por docentes e preceptores de Blumenau, com coffee break completo e emissão de certificado válido para AACCs.',
    imageUrl: '',
    maxCapacity: 140,
    mode: 'presencial',
    locationShort: 'Auditório da Biblioteca — FURB Campus 1',
    mapsUrl: 'https://maps.google.com/?q=Biblioteca+FURB+Blumenau',
    category: 'camblu_coffee',
    isSecimed: false,
    hasCoffee: true,
    palette: {
      primary: '#0f3325',
      secondary1: '#166547',
      secondary2: '#edd16e',
      background: '#f3f7f4',
    },
    startAt: '2026-11-28T08:30:00-03:00',
    endAt: '2026-11-28T12:30:00-03:00',
    published: true,
    createdAt: '2026-10-15T12:00:00.000Z',
    lots: [
      {
        id: 'lot-simp-1',
        name: 'Lote Único (Inclui Coffee)',
        priceCents: 2500,
        totalQuantity: 140,
        soldQuantity: 68,
        qrCodesPerTicket: 1,
        active: true,
        qrDefinitions: [
          {
            id: 'qr-simp-unico',
            label: 'Credenciamento Manhã + Coffee',
            dateTime: '2026-11-28T08:30:00-03:00',
            certificateHours: 4,
          },
        ],
      },
    ],
  },
  {
    id: 'evt-workshop-residencia-online',
    slug: 'jornada-virtual-residencia-medica-2026',
    title: 'Jornada Virtual de Preparação para Residência Médica',
    description:
      'Encontro online exclusivo com residentes e egressos da MEDFURB sobre organização de estudos, currículo para ENARE/SUS-SP e dicas práticas de internato.',
    imageUrl: '',
    maxCapacity: 300,
    mode: 'virtual',
    locationShort: 'Transmissão Online (Google Meet — link liberado aos inscritos)',
    virtualAccessUrl: 'https://meet.google.com/camblu-residencia-demo',
    virtualRevealAt: '2026-11-20T18:00:00-03:00',
    category: 'academico',
    isSecimed: false,
    hasCoffee: false,
    palette: {
      primary: '#0f3325',
      secondary1: '#166547',
      secondary2: '#edd16e',
      background: '#f2f6f2',
    },
    startAt: '2026-12-05T19:00:00-03:00',
    endAt: '2026-12-05T21:30:00-03:00',
    published: true,
    createdAt: '2026-11-01T10:00:00.000Z',
    lots: [
      {
        id: 'lot-online-1',
        name: 'Ingresso Online com Certificado',
        priceCents: 1500,
        totalQuantity: 300,
        soldQuantity: 94,
        qrCodesPerTicket: 1,
        active: true,
        qrDefinitions: [
          {
            id: 'qr-online-presenca',
            label: 'Check-in Digital durante a Live',
            dateTime: '2026-12-05T19:30:00-03:00',
            certificateHours: 3,
          },
        ],
      },
    ],
  },
];

export const PRODUCTS_SEED: ShopProduct[] = [
  {
    id: 'prod-moletom-medfurb',
    slug: 'moletom-oficial-medfurb',
    name: 'Moletom Oficial MEDFURB · Edição Verde Botânico',
    description:
      'Moletom canguru felpado de alta gramatura (3 cabos), bordado dourado frontal CAMBLU e punhos reforçados.',
    priceCents: 16900,
    images: [],
    category: 'Inverno',
    active: true,
    colors: [
      { name: 'Verde Botânico', hex: '#0f3325' },
      { name: 'Bordado Dourado', hex: '#edd16e' },
    ],
    details: [
      'Moletom 3 cabos peluciado (50% algodão / 50% poliéster, 380 g/m²).',
      'Bordado frontal de alta definição com o brasão CAMBLU 1990.',
      'Capuz forrado com cordão ajustável e bolso canguru reforçado.',
      'Acabamento premium pensado para a rotina clínica e acadêmica.',
    ],
    careNotes: 'Lavar à mão ou no ciclo delicado com água fria. Não passar ferro diretamente sobre o bordado.',
    sizes: [
      { size: 'PP', stock: 4 },
      { size: 'P', stock: 11 },
      { size: 'M', stock: 14 },
      { size: 'G', stock: 9 },
      { size: 'GG', stock: 5 },
    ],
  },
  {
    id: 'prod-camiseta-camblu',
    slug: 'camiseta-camblu-1990',
    name: 'Camiseta Algodão Premium CAMBLU 1990',
    description:
      'Malha 100% algodão penteado fio 30.1 na cor verde oficial #0f3325 com estampa dourada em serigrafia de alta durabilidade.',
    priceCents: 5800,
    images: [],
    category: 'Camisetas',
    active: true,
    colors: [
      { name: 'Verde CAMBLU', hex: '#0f3325' },
      { name: 'Off-White Areia', hex: '#fbf3d5' },
    ],
    details: [
      'Algodão penteado 100% fio 30.1 (toque macio e respirável para o dia a dia no campus).',
      'Gola em ribana canelada com reforço ombro a ombro.',
      'Serigrafia dourada de alta durabilidade resistente a múltiplas lavagens.',
      'Membros do Clube CAMBLU recebem 10% de desconto automático na sacola.',
    ],
    careNotes: 'Lavar do avesso e secar à sombra. Evite secadora em alta temperatura para preservar a fibra natural.',
    sizes: [
      { size: 'PP', stock: 6 },
      { size: 'P', stock: 18 },
      { size: 'M', stock: 22 },
      { size: 'G', stock: 16 },
      { size: 'GG', stock: 8 },
    ],
  },
  {
    id: 'prod-garrafinha-termica',
    slug: 'garrafa-termica-camblu-500ml',
    name: 'Garrafa Térmica Inox CAMBLU 500 ml',
    description:
      'Aço inox parede dupla com gravação a laser do brasão CAMBLU. Conserva bebidas geladas por até 24h durante estágios e plantões.',
    priceCents: 7490,
    images: [],
    category: 'Acessórios',
    active: true,
    colors: [
      { name: 'Verde Fosco', hex: '#0f3325' },
      { name: 'Aço Dourado', hex: '#edd16e' },
    ],
    details: [
      'Aço inoxidável 304 com isolamento a vácuo de parede dupla.',
      'Conserva líquidos gelados por até 24h e quentes por até 12h.',
      'Tampa hermética antivazamento livre de BPA — segura para levar na mochila com livros e jaleco.',
      'Gravação permanente a laser com identidade oficial CAMBLU.',
    ],
    careNotes: 'Lavar com esponja macia e detergente neutro antes do primeiro uso. Não levar ao freezer ou micro-ondas.',
    sizes: [{ size: 'Único', stock: 23 }],
  },
  {
    id: 'prod-tirante-cracha',
    slug: 'tirante-porta-cracha-medfurb',
    name: 'Tirante Institucional + Porta-Crachá Rígido MEDFURB',
    description:
      'Tirante acetinado com trava de segurança e mosquetão metálico ideal para crachá hospitalar no HU, Santo Antônio e Santa Isabel.',
    priceCents: 2400,
    images: [],
    category: 'Acessórios',
    active: true,
    colors: [
      { name: 'Verde & Ouro CAMBLU', hex: '#0f3325' },
    ],
    details: [
      'Fita de poliéster acetinado 20 mm com impressão frente e verso em alta resolução.',
      'Trava de segurança anti-sufocamento na nuca exigida em ambientes hospitalares.',
      'Acompanha case porta-crachá rígido vertical + mosquetão giratório cromado.',
    ],
    careNotes: 'Higienizar o porta-crachá com álcool 70% após atividades práticas e internatos.',
    sizes: [{ size: 'Único', stock: 40 }],
  },
];

export const ORDERS_SEED: ShopOrder[] = [
  {
    id: 'ord-demo-1',
    buyerUid: 'demo-student-1',
    buyerName: 'Marina Souza (Turma LXII)',
    buyerEmail: 'marina.demo@furb.br',
    buyerPhone: '47999887766',
    items: [
      {
        productId: 'prod-garrafinha-termica',
        productName: 'Garrafa Térmica Inox CAMBLU 500 ml',
        size: 'Único',
        quantity: 1,
        unitPriceCents: 7490,
      },
    ],
    subtotalCents: 7490,
    discountCents: 749,
    totalCents: 6741,
    paymentMethod: 'stripe_pix',
    paymentStatus: 'paid',
    delivered: false,
    createdAt: '2026-11-10T14:20:00.000Z',
  },
];

export const EDITAIS_SEED: EditalItem[] = [
  {
    id: 'ed-epaf',
    title: 'Edital E-PAF — Apoio Financeiro a Eventos das Ligas Acadêmicas',
    program: 'E-PAF',
    summary:
      'Programa patrocinado exclusivamente pelo CAMBLU que contempla uma liga acadêmica por semestre para viabilizar jornadas, simpósios e fóruns.',
    status: 'aberto',
    deadline: '2026-12-10',
    pdfUrl: 'https://www.camblu.org/editais',
    formsUrl: 'https://docs.google.com/forms/',
    publishedAt: '2026-11-01',
  },
  {
    id: 'ed-epaatc',
    title: 'Edital E-PAATC — Apoio a Apresentação de Trabalhos Científicos',
    program: 'E-PAATC',
    summary:
      'Auxílio financeiro a acadêmicos de Medicina da FURB para apresentação de trabalhos, resumos e artigos em congressos nacionais ou internacionais (4 janelas ao ano).',
    status: 'aberto',
    deadline: '2026-12-15',
    pdfUrl: 'https://www.camblu.org/editais',
    formsUrl: 'https://docs.google.com/forms/',
    publishedAt: '2026-11-01',
  },
  {
    id: 'ed-epafliec',
    title: 'Edital E-PAFLIEC — Parceria Ligas Acadêmicas & IFMSA Brazil FURB',
    program: 'E-PAFLIEC',
    summary:
      'Patrocínio de dois projetos por semestre (ligas acadêmicas ou ações da IFMSA Brazil FURB) para eventos diversificados de maior porte na universidade.',
    status: 'em_breve',
    deadline: '2027-02-20',
    pdfUrl: 'https://www.camblu.org/editais',
    formsUrl: 'https://docs.google.com/forms/',
    publishedAt: '2026-11-05',
  },
  {
    id: 'ed-eleicoes',
    title: 'Edital de Convocação — Eleições Gestão CAMBLU 2027',
    program: 'Eleições',
    summary:
      'Normas para inscrição de chapas, calendário eleitoral e votação aberta aos acadêmicos de Medicina da FURB.',
    status: 'encerrado',
    deadline: '2026-11-06',
    pdfUrl: 'https://www.camblu.org/',
    formsUrl: 'https://docs.google.com/forms/',
    publishedAt: '2026-10-05',
  },
];

export const ANAIS_SEED: AnaisEdition[] = [
  {
    id: 'anais-2026',
    editionTitle: 'Anais da XXIII Semana Científica de Medicina (SECIMED 2026)',
    year: 2026,
    issn: '3086-612X',
    summary:
      'Resumos simples e expandidos aprovados em avaliação duplo-cega por pares nas áreas de clínica médica, cirurgia, educação médica, extensão e saúde coletiva.',
    pdfUrl: 'https://drive.google.com/folderview?id=1SVjmqfarA5jlOIwPqSpg_O7Vkn2hwNHb',
    zenodoUrl: 'https://zenodo.org/communities/secimedfurb/',
    publishedAt: '2026-10-30',
  },
  {
    id: 'anais-2025',
    editionTitle: 'Anais da XXII Semana Científica de Medicina (SECIMED 2025)',
    year: 2025,
    issn: '3086-612X',
    summary:
      'Edição comemorativa reunindo produções científicas de acadêmicos, ligas acadêmicas e docentes do curso de Medicina da FURB sob licença CC BY-NC 4.0.',
    pdfUrl: 'https://drive.google.com/folderview?id=1SVjmqfarA5jlOIwPqSpg_O7Vkn2hwNHb',
    zenodoUrl: 'https://zenodo.org/communities/secimedfurb/',
    publishedAt: '2025-11-12',
  },
];
