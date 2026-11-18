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
  photoUrl?: string,
  instagram?: string,
) {
  return {
    id,
    name,
    cargo,
    instagram,
    photoUrl: photoUrl || makeInitialsAvatar(name, index),
    shape: SHAPES[index % SHAPES.length],
  };
}

export const GESTOES_SEED: GestaoTerm[] = [
  {
    id: 'gestao-2026',
    year: 2026,
    chapaName: 'Gestão Resolução',
    instagram: 'https://www.instagram.com/chaparesolucao2026/',
    mission:
      'Nossa missão é integrar a formação técnica com o desenvolvimento humano, incentivando os acadêmicos a atuarem com competência, empatia e sensibilidade para fortalecer o Centro Acadêmico como espaço acolhedor e colaborativo.',
    proposals: [
      'Criação de projeto de Extensão vinculado ao CAMBLU',
      'Promover maior integração entre os acadêmicos do curso de Medicina',
      'Acompanhar e atualizar-se sobre os assuntos institucionais e acadêmicos, incluindo repasses, DCE, CEF e CONSUNI',
      'Promover maior integração com os outros centros acadêmicos por meio de eventos e parcerias',
      'Estimular participação de acadêmicos e instituições em atividades colaborativas promovidas pela FURB',
      'Fiscalização de programas de auxílio financeiro acadêmico',
      'Incentivar e divulgar a trajetória e conquistas do curso de Medicina da FURB',
      'Fomentar e promover a produção científica',
      'Ampliar disseminação de conhecimento entre a comunidade e os acadêmicos por meio de redes sociais',
      'Facilitar o acesso às principais informações para calouros',
      'Continuidade: desenvolver nova linha de produtos exclusivos do CAMBLU e fortalecer ações de filantropia e impacto social',
      'Continuidade: manter a organização do calendário acadêmico, renovar os espaços de convivência e fortalecer a integração com AAARIH e IFMSA Brazil FURB',
    ],
    members: [
      member('g26-1', 'André Krautler', 'Presidente', 0),
      member('g26-2', 'Amanda Schmidt Scarpini', 'Vice-Presidente', 1, '/gestoes/2026/g26-2.webp'),
      member('g26-3', 'Arthur Christoff', 'Tesoureiro(a)', 2, '/gestoes/2026/g26-3.webp'),
      member('g26-4', 'Letícia Hemkemeier', 'Secretário(a) Geral', 3, '/gestoes/2026/g26-4.webp'),
      member('g26-5', 'Caio Vincenzo Bertoldi Bazzanella', 'Secretário(a) Adjunto(a)', 4),
      member('g26-6', 'Luísa Clara Zanchett', 'Diretoria de Comunicações Externas', 5, '/gestoes/2026/g26-6.webp'),
      member('g26-7', 'Luiza Ferreira de Melo', 'Diretoria de Comunicações Externas', 6),
      member('g26-8', 'Amanda de Miranda', 'Diretoria de Assuntos Acadêmicos', 7),
      member('g26-9', 'Maria Luiza Biz', 'Diretoria de Políticas Científicas', 8),
      member('g26-10', 'Raquel Fontana Triches', 'Diretoria de Patrimônio', 9, '/gestoes/2026/g26-10.webp'),
      member('g26-11', 'Sofia Belotti Junkes', 'Diretoria de Filantropia', 10, '/gestoes/2026/g26-11.webp'),
      member('g26-12', 'Marina Schorr Caesar', 'Diretoria de Filantropia', 11),
      member('g26-13', 'Emily Vitória Antunes', 'Diretoria de Filantropia', 12),
      member('g26-14', 'Manoella de Miranda', 'Diretoria de Comunicação e Marketing', 13, '/gestoes/2026/g26-14.webp'),
      member('g26-15', 'Alexia Dal Comuni', 'Diretoria de Comunicação e Marketing', 14),
      member('g26-16', 'Beatriz Prats', 'Diretoria de Comunicação e Marketing', 15, '/gestoes/2026/g26-16.webp'),
      member('g26-17', 'Isabelly Cofferri', 'Diretoria de Ligas Acadêmicas', 16),
      member('g26-18', 'Ana Laura Zardo', 'Diretoria de Ligas Acadêmicas', 17),
      member('g26-19', 'Júlia de Gois', 'Diretoria de Eventos', 18),
      member('g26-20', 'Maria Teodora', 'Diretoria de Eventos', 19, '/gestoes/2026/g26-20.webp'),
    ],
  },
  {
    id: 'gestao-2024',
    year: 2024,
    chapaName: 'Gestão Renovação',
    instagram: 'https://www.instagram.com/chaparenovacao2024/',
    mission:
      'Renovação dos espaços de convivência, maior integração com a FURB e instituições parceiras, consolidação da transparência estudantil e reformulação do site do CAMBLU.',
    proposals: [
      'Maior integração com instituições parceiras, AAARIH e IFMSA Brazil FURB',
      'Maior integração com a FURB e com o Departamento de Medicina',
      'Fiscalização na ordenação do quadro de professores',
      'Renovação dos espaços de convivência para acadêmicos de Medicina',
      'Adaptação ao Universidade Gratuita',
      'Organização de calendário acadêmico contendo os eventos do curso de Medicina',
      'Reformulação do site do CAMBLU',
      'Fortalecimento da filantropia e auxílio e fiscalização das ligas acadêmicas',
      'Continuidade: CAMBLU Mulher, Projeto Treineiros, Apoio aos Pequenos Negócios, PAATC e PAF-Ligas, Eventos dentro do curso e Inovações na Lojinha do CAMBLU',
    ],
    members: [
      member('g24-1', 'Gabriel Garcia', 'Presidente', 0, '/gestoes/2024/g24-1.webp'),
      member('g24-2', 'Maria Carolina Nogara', 'Vice-Presidente', 1, '/gestoes/2024/g24-2.webp'),
      member('g24-3', 'Isabella Pereira Benvenutti', 'Tesoureiro(a)', 2, '/gestoes/2024/g24-3.webp'),
      member('g24-4', 'Laiza Natasha Fachini', 'Secretário(a) Geral', 3, '/gestoes/2024/g24-4.webp'),
      member('g24-5', 'Pietra Bianca Lautenschlager', 'Secretário(a) Adjunto(a)', 4, '/gestoes/2024/g24-5.webp'),
      member('g24-6', 'Francisco Cesconetto', 'Diretoria de Comunicações Externas', 5, '/gestoes/2024/g24-6.webp'),
      member('g24-7', 'Bárbara Wozniak Schatz', 'Diretoria de Assuntos Acadêmicos', 6, '/gestoes/2024/g24-7.webp'),
      member('g24-8', 'Maria Fernanda Quandt Treml', 'Diretoria de Políticas Científicas', 7, '/gestoes/2024/g24-8.webp'),
      member('g24-9', 'Evandro Dirceu Ender', 'Diretoria de Patrimônio', 8, '/gestoes/2024/g24-9.webp'),
      member('g24-10', 'Maria Luiza Borges', 'Diretoria de Patrimônio', 9, '/gestoes/2024/g24-10.webp'),
      member('g24-11', 'Ana Clara Muller', 'Diretoria de Filantropia', 10, '/gestoes/2024/g24-11.webp'),
      member('g24-12', 'Isadora Medeiros', 'Diretoria de Filantropia', 11, '/gestoes/2024/g24-12.webp'),
      member('g24-13', 'Sofia Castelo de Souza Nemetz', 'Diretoria de Comunicação e Marketing', 12, '/gestoes/2024/g24-13.webp'),
      member('g24-14', 'Nicole Christine Lamin', 'Diretoria de Comunicação e Marketing', 13, '/gestoes/2024/g24-14.webp'),
      member('g24-15', 'Caroline Bettoni', 'Diretoria de Ligas Acadêmicas', 14, '/gestoes/2024/g24-15.webp'),
      member('g24-16', 'Rúbia Farias', 'Diretoria de Ligas Acadêmicas', 15, '/gestoes/2024/g24-16.webp'),
      member('g24-17', 'Karina Cavalcante da Silva', 'Diretoria de Eventos', 16, '/gestoes/2024/g24-17.webp'),
      member('g24-18', 'Sara Duarte', 'Diretoria de Eventos', 17, '/gestoes/2024/g24-18.webp'),
      member('g24-19', 'Carlos Eduardo Bassani', 'Treineiro(a)', 18, '/gestoes/2024/g24-19.webp'),
      member('g24-20', 'Arthur Paludo Christoff', 'Treineiro(a)', 19, '/gestoes/2024/g24-20.webp'),
      member('g24-21', 'Heitor Queirós Herdy', 'Treineiro(a)', 20, '/gestoes/2024/g24-21.webp'),
      member('g24-22', 'André Krautler', 'Treineiro(a)', 21, '/gestoes/2024/g24-22.webp'),
    ],
  },
];
