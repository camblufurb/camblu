import type { GestaoCargo, GestaoTerm, M3ShapeVariant } from '../types/domain';

export const GESTAO_CARGO_OPTIONS: GestaoCargo[] = [
  'Presidente',
  'Vice-Presidente',
  'Tesoureiro(a)',
  'Secretário(a) Geral',
  'Secretário(a) Adjunto(a)',
  'Diretoria de Comunicações Externas',
  'Diretoria de Assuntos Acadêmicos',
  'Diretoria de Políticas Científicas',
  'Diretoria de Patrimônio',
  'Diretoria de Filantropia',
  'Diretoria de Comunicação e Marketing',
  'Diretoria de Ligas Acadêmicas',
  'Diretoria de Eventos',
  'Treineiro(a)',
];

const SHAPES: M3ShapeVariant[] = [
  'squircle',
  'clover4',
  'arch',
  'flower',
  'clover8',
  'gem',
  'sunny',
  'pill',
];

function makeInitialsAvatar(name: string, index: number): string {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
  const palettes = [
    ['#0f3325', '#edd16e'],
    ['#174936', '#f1de97'],
    ['#0d2b66', '#dbe9ff'],
    ['#2b2100', '#edd16e'],
  ];
  const [bg, fg] = palettes[index % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="${bg}"/><circle cx="190" cy="48" r="36" fill="${fg}" opacity="0.14"/><circle cx="42" cy="198" r="46" fill="${fg}" opacity="0.1"/><text x="120" y="136" text-anchor="middle" font-family="system-ui,sans-serif" font-size="78" font-weight="800" fill="${fg}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function member(
  id: string,
  name: string,
  cargo: GestaoCargo,
  index: number,
  instagram?: string,
) {
  return {
    id,
    name,
    cargo,
    instagram,
    photoUrl: makeInitialsAvatar(name, index),
    shape: SHAPES[index % SHAPES.length],
  };
}

export const GESTOES_SEED: GestaoTerm[] = [
  {
    id: 'gestao-2026',
    year: 2026,
    chapaName: 'Gestão Resolução',
    instagram: 'https://www.instagram.com/chaparesolucao/',
    mission:
      'Integrar a formação técnica com o desenvolvimento humano, fortalecendo o Centro Acadêmico como espaço acolhedor, transparente e colaborativo.',
    proposals: [
      'Criação de projeto de Extensão vinculado ao CAMBLU',
      'Integração contínua com DCE, CEF, CONSUNI, AAARIH e IFMSA Brazil FURB',
      'Fiscalização dos programas de auxílio financeiro estudantil',
      'Renovação dos espaços de convivência e descanso no Edifício Cristina',
      'Fomento à produção científica, SECIMED e acesso simplificado aos calouros',
    ],
    members: [
      member('g26-1', 'André Krautler', 'Presidente', 0),
      member('g26-2', 'Amanda Schmidt Scarpini', 'Vice-Presidente', 1),
      member('g26-3', 'Arthur Christoff', 'Tesoureiro(a)', 2),
      member('g26-4', 'Letícia Hemkemeier', 'Secretário(a) Geral', 3),
      member('g26-5', 'Caio Vincenzo Bertoldi Bazzanella', 'Secretário(a) Adjunto(a)', 4),
      member('g26-6', 'Luísa Clara Zanchett', 'Diretoria de Comunicações Externas', 5),
      member('g26-7', 'Luiza Ferreira de Melo', 'Diretoria de Comunicações Externas', 6),
      member('g26-8', 'Amanda de Miranda', 'Diretoria de Assuntos Acadêmicos', 7),
      member('g26-9', 'Maria Luiza Biz', 'Diretoria de Políticas Científicas', 8),
      member('g26-10', 'Raquel Fontana Triches', 'Diretoria de Patrimônio', 9),
      member('g26-11', 'Sofia Belotti Junkes', 'Diretoria de Filantropia', 10),
      member('g26-12', 'Marina Schorr Caesar', 'Diretoria de Filantropia', 11),
      member('g26-13', 'Emily Vitória Antunes', 'Diretoria de Filantropia', 12),
      member('g26-14', 'Manoella de Miranda', 'Diretoria de Comunicação e Marketing', 13),
      member('g26-15', 'Alexia Dal Comuni', 'Diretoria de Comunicação e Marketing', 14),
      member('g26-16', 'Beatriz Prats', 'Diretoria de Comunicação e Marketing', 15),
      member('g26-17', 'Isabelly Cofferri', 'Diretoria de Ligas Acadêmicas', 16),
      member('g26-18', 'Ana Laura Zardo', 'Diretoria de Ligas Acadêmicas', 17),
      member('g26-19', 'Júlia de Gois', 'Diretoria de Eventos', 18),
      member('g26-20', 'Maria Teodora', 'Diretoria de Eventos', 19),
    ],
  },
  {
    id: 'gestao-2024',
    year: 2024,
    chapaName: 'Gestão Renovação',
    instagram: 'https://www.instagram.com/chaparenovacao2024/',
    mission:
      'Renovação dos espaços de convivência, consolidação da transparência estudantil, calendário unificado de ligas e reformulação digital do CAMBLU.',
    proposals: [
      'Maior integração com AAARIH, IFMSA Brazil FURB e Departamento de Medicina',
      'Renovação dos espaços de convivência e acompanhamento do Universidade Gratuita',
      'Fortalecimento da filantropia, PAATC, PAF-Ligas e Projeto Treineiros',
    ],
    members: [
      member('g24-1', 'Gabriel Garcia', 'Presidente', 0),
      member('g24-2', 'Maria Carolina Nogara', 'Vice-Presidente', 1),
      member('g24-3', 'Isabella Pereira Benvenutti', 'Tesoureiro(a)', 2),
      member('g24-4', 'Laiza Natasha Fachini', 'Secretário(a) Geral', 3),
      member('g24-5', 'Pietra Bianca Lautenschlager', 'Secretário(a) Adjunto(a)', 4),
      member('g24-6', 'Francisco Cesconetto', 'Diretoria de Comunicações Externas', 5),
      member('g24-7', 'Bárbara Wozniak Schatz', 'Diretoria de Assuntos Acadêmicos', 6),
      member('g24-8', 'Maria Fernanda Quandt Treml', 'Diretoria de Políticas Científicas', 7),
      member('g24-9', 'Evandro Dirceu Ender', 'Diretoria de Patrimônio', 8),
      member('g24-10', 'Maria Luiza Borges', 'Diretoria de Patrimônio', 9),
      member('g24-11', 'Ana Clara Muller', 'Diretoria de Filantropia', 10),
      member('g24-12', 'Isadora Medeiros', 'Diretoria de Filantropia', 11),
      member('g24-13', 'Sofia Castelo de Souza Nemetz', 'Diretoria de Comunicação e Marketing', 12),
      member('g24-14', 'Nicole Christine Lamin', 'Diretoria de Comunicação e Marketing', 13),
      member('g24-15', 'Caroline Bettoni', 'Diretoria de Ligas Acadêmicas', 14),
      member('g24-16', 'Rúbia Farias', 'Diretoria de Ligas Acadêmicas', 15),
      member('g24-17', 'Karina Cavalcante da Silva', 'Diretoria de Eventos', 16),
      member('g24-18', 'Sara Duarte', 'Diretoria de Eventos', 17),
      member('g24-19', 'Carlos Eduardo Bassani', 'Treineiro(a)', 18),
      member('g24-20', 'Arthur Paludo Christoff', 'Treineiro(a)', 19),
      member('g24-21', 'Heitor Queirós Herdy', 'Treineiro(a)', 20),
      member('g24-22', 'André Krautler', 'Treineiro(a)', 21),
    ],
  },
];
