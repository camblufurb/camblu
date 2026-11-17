export interface ManualChapter {
  id: string;
  title: string;
  icon: string;
  summary: string;
  blocks: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
    links?: { label: string; url: string }[];
  }[];
}

export const MANUAL_PDF_URL =
  'https://drive.google.com/file/d/1JsiF4ozrt5XuVhCOiEjCQhaVZIhrHHJn/view';

export const FRESHMAN_CHECKLIST = [
  'Completar cadastro aqui no portal CAMBLU informando turma e tamanho da camiseta de calouro',
  'Acessar o Portal Acadêmico, o DION (notas/faltas) e o AVA3 (materiais e planos de ensino)',
  'Participar da recepção conjunta (CAMBLU, AAARIH e IFMSA) e conhecer sua linhagem',
  'Garantir presença na Cerimônia do Jaleco e assinar o Livro de Linhagens',
  'Acompanhar o calendário acadêmico das Ligas Acadêmicas e processos seletivos semestrais',
  'Organizar desde o 1º semestre o controle das 216 horas de AACCs exigidas até a formatura',
];

export const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: 'boas-vindas',
    title: 'Boas-Vindas à MEDFURB',
    icon: 'waving_hand',
    summary: 'Sua nova casa pelos próximos seis anos: acolhimento, energia e comunidade.',
    blocks: [
      {
        heading: 'Parabéns, calouro(a) — agora você é um Leãozinho!',
        paragraphs: [
          'Seja bem-vindo à Medicina da FURB! Aqui você vai rir, estudar muito, construir amizades para a vida toda e descobrir que a jornada médica é tão intensa quanto gratificante.',
          'Seus veteranos, professores e todas as entidades estudantis (CAMBLU, AAARIH e IFMSA Brazil FURB) estão aqui para apoiar você desde o primeiro dia.',
        ],
      },
    ],
  },
  {
    id: 'medfurb',
    title: 'A MEDFURB & Acreditação SAEME',
    icon: 'verified',
    summary: '36 anos de história, 51 turmas formadas, Turma LXIII e selo internacional SAEME.',
    blocks: [
      {
        heading: 'Histórico e Coordenação',
        paragraphs: [
          'Fundado em 05/03/1990, o curso de Medicina da FURB completa 36 anos formando médicos com sólida base geral, já somando 51 turmas formadas — e recebendo agora a Turma LXIII.',
          'O coordenador do curso é o Prof. Dr. Leandro José Haas (neurocirurgião e professor da disciplina de Neurocirurgia). O Departamento funciona no 1º andar do Bloco J (Campus 1) pelo e-mail medicina@furb.br e telefone (47) 3321-0277.',
        ],
      },
      {
        heading: 'Único curso em Santa Catarina com Acreditação Internacional SAEME',
        paragraphs: [
          'Avaliado pelo Conselho Federal de Medicina (CFM) em 80 critérios de qualidade pedagógica, corpo docente e ambientação, o curso possui validade internacional reconhecida pela Federação Mundial para Educação Médica (WFME), ampliando portas para estágios e atuação no exterior.',
        ],
      },
    ],
  },
  {
    id: 'camblu',
    title: 'O CAMBLU e Nossos Eventos',
    icon: 'account_balance',
    summary: 'Representação discente, espaços estudantis, Cerimônia do Jaleco e SECIMED.',
    blocks: [
      {
        heading: 'Quem faz o CAMBLU',
        paragraphs: [
          'O Centro Acadêmico de Medicina de Blumenau representa todos os estudantes perante a universidade e coordena eventos, ações filantrópicas, calendário acadêmico e espaços no Edifício Cristina (Convivência, Coworking e Descanso).',
        ],
        bullets: [
          'Cerimônia do Jaleco: ritual de passagem em que o veterano veste o jaleco no calouro e acontece a assinatura oficial do Livro de Linhagens.',
          'Integração de Calouros: encontro festivo e acolhedor no início de cada semestre entre calouros e veteranos.',
          'SECIMED: Semana Científica de Medicina realizada anualmente desde 2002 com palestras, workshops e publicação de Anais.',
          'Lojinha do CAMBLU e Clube CAMBLU: produtos oficiais e planos de vantagens integrados aqui no site.',
        ],
      },
    ],
  },
  {
    id: 'atletica',
    title: 'AAARIH & Bateria Fera',
    icon: 'sports_soccer',
    summary: 'Esportes, treinos semanais, Intermed Sul, JUMED, Sunset e Oktomed.',
    blocks: [
      {
        heading: 'Associação Atlética Acadêmica Romualdo Izon Heil',
        paragraphs: [
          'Fundada em 12/11/2005, a AAARIH é referência esportiva e festiva no sul do Brasil, levando o mascote Leão da Medicina FURB para quadras e arenas.',
        ],
        bullets: [
          'Competições: Intermed Sul (36 atléticas), JUMED/SC, CopaMed e Jogos Internos (JIM).',
          'Treinos semanais em diversas modalidades para sócios.',
          'Eventos clássicos: Sunset (apresentação oficial de cada novo leão) e Oktomed.',
          'Bateria Fera: a batucada oficial da Medicina FURB aberta a novos ritmistas desde a 1ª fase.',
        ],
      },
    ],
  },
  {
    id: 'ifmsa',
    title: 'IFMSA Brazil FURB',
    icon: 'public',
    summary: 'Sete times de educação médica, saúde pública, direitos humanos e intercâmbios.',
    blocks: [
      {
        heading: 'Pense global, aja local',
        paragraphs: [
          'O comitê local conecta acadêmicos da FURB à maior federação estudantil médica do mundo, acumulando pontos para intercâmbios nacionais e internacionais.',
        ],
        bullets: [
          'SCOME: Educação Médica e preenchimento de lacunas curriculares.',
          'SCOPH: Saúde Pública (Hospital do Ursinho, ações em comunidade, Setembro Amarelo).',
          'SCORA: Saúde Sexual e Reprodutiva, inclusão HIV/AIDS e testagens.',
          'SCORP: Direitos Humanos, Paz e acolhimento de minorias na saúde.',
          'Intercâmbio, Capacity Building (CB) e NUPEC (Núcleo de Pesquisa Científica).',
        ],
      },
    ],
  },
  {
    id: 'ligas',
    title: 'Ligas Acadêmicas',
    icon: 'biotech',
    summary: 'Ensino, pesquisa e extensão em 35 especialidades médicas da FURB.',
    blocks: [
      {
        heading: 'Como participar das 35 Ligas da MEDFURB',
        paragraphs: [
          'As ligas promovem palestras, discussões de casos clínicos, workshops práticos, produção científica e estágios extracurriculares aprovados pelo DAEX.',
          'Você pode participar de mais de uma liga ao mesmo tempo — apenas cuide dos horários e da frequência mínima exigida para certificação.',
        ],
      },
    ],
  },
  {
    id: 'tradicoes',
    title: 'Tradições: Trote Solidário & Linhagens',
    icon: 'diversity_3',
    summary: 'Integração humanizada e o vínculo histórico entre veterano e calouro.',
    blocks: [
      {
        heading: 'Trote Solidário e Livro de Linhagens',
        paragraphs: [
          'Na MEDFURB o trote tem foco solidário e social, conectando os recém-ingressos a ações comunitárias em Blumenau.',
          'Já as Linhagens formam árvores de apadrinhamento registradas em livro oficial: seu veterano orienta rotinas de estudo, empresta materiais e acompanha sua adaptação ao curso até a formatura.',
        ],
      },
    ],
  },
  {
    id: 'sistemas-furb',
    title: 'Plataformas, AACCs, MIPE & Teste de Progresso',
    icon: 'laptop_mac',
    summary: 'Portal Acadêmico, DION, AVA3, 216h de AACCs e avaliações anuais.',
    blocks: [
      {
        heading: 'Plataformas essenciais do dia a dia',
        paragraphs: [
          'Domine desde a primeira semana os três sistemas digitais da FURB para não perder prazos de matrícula, frequências ou entregas.',
        ],
        bullets: [
          'Portal Acadêmico: rematrícula, horários, requerimentos, envio de AACCs e classificados.',
          'DION: consulta de notas e controle de faltas (mantenha sempre sua própria anotação de presença).',
          'AVA3: planos de ensino, slides, provas/trabalhos e disciplinas híbridas.',
          'AACCs: mínimo de 216 horas complementares distribuídas entre extensão, pesquisa, monitoria e eventos até o fim do curso (eventos do CAMBLU com QR Code geram certificados válidos!).',
          'MIPE (Mostra Integrada de Ensino, Pesquisa, Extensão e Cultura) e Teste de Progresso anual (120 questões clínicas contextualizadas).',
        ],
        links: [
          { label: 'Portal Acadêmico FURB', url: 'https://www.furb.br/web/1603/servicos/portal-academico/apresentacao' },
          { label: 'Sistema DION', url: 'https://www.furb.br/dion/' },
          { label: 'Ambiente AVA3', url: 'https://ava3.furb.br/my/' },
        ],
      },
    ],
  },
  {
    id: 'auxilios',
    title: 'Auxílio Estudantil e Bolsas',
    icon: 'payments',
    summary: 'Universidade Gratuita, FlexFURB, Credifurb e apoio da CAE.',
    blocks: [
      {
        heading: 'Opções de permanência na FURB',
        paragraphs: [
          'Fique atento aos editais semestrais da Coordenadoria de Assuntos Estudantis (CAE · cae@furb.br · (47) 3321-0307). No Universidade Gratuita, lembre-se da obrigatoriedade semestral de aprovação mínima de 75% das disciplinas cursadas.',
        ],
      },
    ],
  },
  {
    id: 'saude-mental',
    title: 'Saúde Mental & CAMBLU Mulher',
    icon: 'favorite',
    summary: 'Equilíbrio emocional, rede de apoio e canal seguro de acolhimento.',
    blocks: [
      {
        heading: 'Para cuidar do outro, cuide primeiro de você',
        paragraphs: [
          'O início da faculdade traz muitas expectativas e disciplinas densas como Anatomia. Organize sua rotina com metas realistas, evite comparações, crie rede de apoio e procure o acolhimento psicológico da CAE quando sentir necessidade.',
          'Se presenciar ou viver qualquer situação ofensiva ou de assédio no curso, utilize o canal sigiloso CAMBLU Mulher aqui no portal — aberto a qualquer estudante.',
        ],
      },
    ],
  },
];
