export interface CarouselHighlightSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  icon: string;
  to: string;
  ctaLabel: string;
}

export const HOME_CAROUSEL_SLIDES: CarouselHighlightSlide[] = [
  {
    id: 'slide-camblu',
    title: 'Sobre o CAMBLU & Espaços no Edifício Cristina',
    subtitle:
      'Representação discente desde 1990 e salas exclusivas de convivência, coworking e descanso para os acadêmicos.',
    badge: 'Institucional & Patrimônio',
    accent: '#0f3325',
    icon: 'apartment',
    to: '/sobre',
    ctaLabel: 'Saiba mais',
  },
  {
    id: 'slide-instituicoes',
    title: 'Ecossistema Estudantil: CAMBLU, AAARIH, DCE e IFMSA',
    subtitle:
      'Conheça o papel de cada entidade acadêmica, esportiva, humanitária e representativa da Medicina FURB.',
    badge: 'Instituições MEDFURB',
    accent: '#174936',
    icon: 'groups',
    to: '/medfurb/instituicoes',
    ctaLabel: 'Conhecer instituições',
  },
  {
    id: 'slide-secimed',
    title: 'SECIMED & Publicações Científicas Anuais',
    subtitle:
      'Palestras magnas, workshops das ligas acadêmicas e Anais indexados em acesso aberto (ISSN 3086-612X).',
    badge: 'Produção Científica',
    accent: '#1d3f5e',
    icon: 'science',
    to: '/secimed',
    ctaLabel: 'Saiba mais',
  },
  {
    id: 'slide-clube',
    title: 'Clube CAMBLU & Lojinha Oficial MEDFURB',
    subtitle:
      'Assinaturas com cartão digital, descontos em produtos oficiais e condições especiais nos eventos do curso.',
    badge: 'Benefícios & Produtos',
    accent: '#2b2100',
    icon: 'workspace_premium',
    to: '/clube',
    ctaLabel: 'Explorar Clube',
  },
];

export const SPACES_DATA = [
  {
    id: 'convivencia',
    name: 'Sala de Convivência',
    location: 'Edifício Cristina · Medicina FURB',
    icon: 'coffee',
    status: 'Disponível',
    description:
      'Ambiente acolhedor equipado com geladeira, cafeteira, micro-ondas e área de descanso com sofá, puffs e TV para intervalos entre aulas e plantões.',
    highlights: ['Geladeira e micro-ondas compartilhados', 'Cafeteira e cantinho do café', 'Sofá, puffs e TV'],
  },
  {
    id: 'coworking',
    name: 'Sala de Coworking',
    location: 'Edifício Cristina · Medicina FURB',
    icon: 'menu_book',
    status: 'Disponível',
    description:
      'Ambiente de estudo silencioso que conta com acervo de livros e revistas médicas doados por acadêmicos e professores, impressora, mesas amplas e cadeiras confortáveis.',
    highlights: ['Acervo de livros e tratados médicos', 'Impressora para uso acadêmico', 'Mesas colaborativas de estudo'],
  },
  {
    id: 'descanso',
    name: 'Sala de Descanso',
    location: 'Edifício Cristina · Medicina FURB',
    icon: 'hotel',
    status: 'Em reforma e ampliação',
    description:
      'Espaço dedicado ao repouso dos estudantes entre turnos intensos de aula, ambulatórios e internato, passando por melhorias estruturais para maior conforto.',
    highlights: ['Ambiente de baixa luminosidade', 'Reestruturação com foco em ergonomia', 'Acesso por senha com a gestão'],
  },
];

export const FURB_INSTITUTIONS = [
  {
    id: 'camblu',
    acronym: 'CAMBLU',
    name: 'Centro Acadêmico de Medicina de Blumenau',
    founded: '1990',
    instagram: '@camblufurb',
    instagramUrl: 'https://www.instagram.com/camblufurb/',
    icon: 'account_balance',
    summary:
      'Entidade sem fins lucrativos e apartidária que representa os acadêmicos de Medicina da FURB junto à coordenação, departamento, DCE e conselhos superiores.',
    pillars: [
      'Mediação pedagógica e resolução de demandas das turmas',
      'Organização da SECIMED, Cerimônia do Jaleco e integração dos calouros',
      'Fomento científico por meio dos editais E-PAF, E-PAATC e E-PAFLIEC',
      'Gestão transparente dos espaços estudantis no Edifício Cristina',
    ],
  },
  {
    id: 'ifmsa',
    acronym: 'IFMSA Brazil FURB',
    name: 'International Federation of Medical Students’ Associations',
    founded: 'Comitê Local FURB',
    instagram: '@ifmsabrazilfurb',
    instagramUrl: 'https://www.instagram.com/ifmsabrazilfurb/',
    icon: 'public',
    summary:
      'Organização mundial presente em mais de 130 países com a missão "pense global, aja local". Na FURB atua com 7 times temáticos e intercâmbios médicos.',
    pillars: [
      'SCOME (Educação Médica) e SCOPH (Saúde Pública e Hospital do Ursinho)',
      'SCORA (Saúde Sexual e Reprodutiva) e SCORP (Direitos Humanos e Paz)',
      'Intercâmbios nacionais e internacionais com pontuação por atividades',
      'Capacity Building (CB) e NUPEC (Núcleo de Pesquisa Científica)',
    ],
  },
  {
    id: 'dce',
    acronym: 'DCE FURB',
    name: 'Diretório Central dos Estudantes',
    founded: 'Representação Geral FURB',
    instagram: 'DCE FURB',
    instagramUrl: 'https://www.furb.br/',
    icon: 'campaign',
    summary:
      'Entidade máxima de representação de todos os acadêmicos da universidade perante a Reitoria, CONSUN, CONSEPE, UCE e UNE.',
    pillars: [
      'Assento e voto nos Conselhos Superiores (CONSUN e CONSEPE)',
      'Fiscalização de mensalidades, bolsas, Universidade Gratuita e infraestrutura',
      'Emissão oficial da Carteirinha Estudantil (meia-entrada)',
      'Apoio jurídico/psicológico transversal e canal DCE Mulher',
    ],
  },
  {
    id: 'aaarih',
    acronym: 'AAARIH',
    name: 'Associação Atlética Acadêmica Romualdo Izon Heil',
    founded: '12/11/2005',
    instagram: '@atleticamedfurb',
    instagramUrl: 'https://www.instagram.com/atleticamedfurb/',
    icon: 'sports_soccer',
    summary:
      'A maior Atlética do Sul, responsável pelo desporto universitário, treinos semanais, campanhas filantrópicas, Bateria Fera e eventos clássicos da MEDFURB.',
    pillars: [
      'Treinos semanais de futsal, handebol, voleibol, basquete, judô e atletismo',
      'Competições: Intermed Sul, JUMED/SC, CopaMed e Jogos Internos (JIM)',
      'Eventos tradicionais: Sunset (calourada) e Oktomed',
      'Bateria Fera e manutenção do mascote Leão da Medicina FURB',
    ],
  },
];

export const MEDFURB_DATA = {
  foundedDate: '05/03/1990',
  anniversaryYears: 36,
  graduatedClasses: 51,
  currentFreshmenClass: 'Turma LXIII',
  departmentPhone: '(47) 3321-0277',
  departmentEmail: 'medicina@furb.br',
  saeme: {
    accreditedSince: 'Novembro de 2023',
    validUntil: '2029',
    criteriaCount: 80,
    highlights: [
      'Único curso de Medicina em Santa Catarina com selo de Acreditação Internacional SAEME (CFM / WFME).',
      'Entre os 44 cursos certificados nacionalmente, viabilizando estágios e reconhecimento internacional.',
      'Hospital Universitário próprio no Campus 5, Policlínica Universitária e ambulatórios integrados desde o início do curso.',
    ],
  },
  directors: [
    { role: 'Coordenador do Curso e Presidente do NDE', name: 'Dr. Leandro José Haas' },
    { role: 'Chefe do Departamento de Medicina', name: 'Dr. Romero Fenili' },
    { role: 'Diretora do CCS da FURB', name: 'Andrea da Silva' },
    { role: 'Reitora da FURB', name: 'Márcia Cristina Sardá Espíndola' },
    { role: 'Vice-Reitor da FURB', name: 'Marcos Vinicius Marques de Moraes' },
    { role: 'Pró-Reitor de Ensino (PROEN)', name: 'Dr. Romeu Hausmann' },
    { role: 'Pró-Reitora de Pesquisa e Extensão (PROPEX)', name: 'Michele Susan Krueger Volpi' },
    { role: 'Pró-Reitor de Administração (PROAD)', name: 'Jamis Antônio Piazza' },
  ],
  collegiumMembers: [
    'Leandro José Haas (Medicina)',
    'Fulvio Clemo Santos Thomazelli (Medicina)',
    'Marcelo Augusto Scheidemantel Nogara (Medicina)',
    'Ricardo Dantas Lopes (Medicina)',
    'Deise Maria Vargas (Medicina)',
    'Romero Fenili (Medicina)',
    'Elza Medeiros Gonçalves Sperb (Medicina)',
    'Caroline Valente (DCN)',
    'Cláudia Coelho (DCN)',
    'Representação Discente (CAMBLU / Acadêmicos)',
  ],
  infrastructure: [
    'Hospital Universitário (Campus 5) & Policlínica Universitária',
    'Laboratório de Anatomia Humana & Laboratório de Habilidades',
    'Laboratórios de Bioquímica, Genética, Imunologia, Microbiologia e Parasitologia',
    'Laboratórios de Microscopia 1 e 2, Farmacodinâmica e Análises Clínicas',
    'Laboratórios de Pesquisa em Bioanálises e Farmacologia',
    'Biblioteca Universitária, Laboratório de Informática e Complexo Desportivo',
    'Espaços CAMBLU (Convivência, Coworking) e Sala de Reunião Conjunta (CAMBLU, AAARIH, IFMSA)',
  ],
  studentAid: [
    {
      name: 'Universidade Gratuita (SC)',
      summary:
        'Programa estadual (LC nº 831/2023) para estudantes em primeira graduação presencial residentes em SC há 5+ anos ou naturais do estado, com renda per capita inferior a 8 salários mínimos para Medicina.',
      url: 'https://www.furb.br/web/5940/servicos/portal-academico/apoio-ao-estudante/universidade-gratuita',
    },
    {
      name: 'Credifurb',
      summary:
        'Crédito educativo próprio da FURB: pague 50% da mensalidade durante a graduação e os outros 50% após a conclusão do vínculo. Compatível com editais semestrais.',
      url: 'https://www.furb.br/web/5270/servicos/portal-academico/apoio-ao-estudante/credifurb',
    },
    {
      name: 'FlexFURB',
      summary:
        'Financiamento estudantil de até 70% dos encargos educacionais durante o curso (incompatível apenas com quem já possui Credifurb).',
      url: 'https://www.furb.br/web/5270/servicos/portal-academico/apoio-ao-estudante/flexfurb',
    },
    {
      name: 'UNIEDU (Renovação)',
      summary:
        'Programa estadual em fase de extinção, mantido exclusivamente para renovação dos acadêmicos já contemplados anteriormente.',
      url: 'https://www.furb.br/web/1628/servicos/portal-academico/apoio-ao-estudante/renovacao-uniedu',
    },
  ],
  optionalInternships: {
    description:
      'Estágio de 6 semanas (dividido normalmente em dois períodos de 3 semanas) em hospitais ou UBS escolhidos pelo aluno em qualquer lugar do Brasil ou exterior. A partir de 2025 passou a integrar a 12ª fase.',
    tips: 'Entre em contato com a instituição desejada com pelo menos 3 meses de antecedência (preferencialmente no semestre anterior) e priorize locais com programa de residência médica na área de interesse.',
    hospitals: [
      'Hospital Regional de São José',
      'Hospital Evangélico Mackenzie do Paraná',
      'Hospital Santa Isabel (Blumenau)',
      'Hospital Santo Antônio (Blumenau)',
      'Hospital Ruth Cardoso',
      'Hospital Universitário da UFSC',
      'Hospital de Clínicas da UFRGS (HCPA)',
      'Unidades Básicas de Saúde (UBS)',
    ],
  },
  tcc: {
    description:
      'Desenvolvido individualmente ou em duplas a partir de Pesquisa em Medicina I (6ª fase), passando por Pesquisa II (7ª fase) e finalizando em TCC (8ª fase).',
    requirements: [
      'Orientador do quadro permanente de professores da FURB',
      'Titulação mínima de Mestre',
    ],
    contacts: [
      'Prof. Romero Fenili (Coordenador do TCC — 8ª fase): fenili@furb.br',
      'Prof. Ernani Santa Helena (Pesquisa em Medicina II — 7ª fase)',
      'Profa. Elza Medeiros Gonçalves Sperb (Pesquisa em Medicina I — 6ª fase): esperb@furb.br',
    ],
  },
};

export const SECIMED_INFO = {
  issn: '3086-612X',
  license: 'Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
  since: 2002,
  instagramHandle: '@secimedfurb',
  instagramUrl: 'https://www.instagram.com/secimedfurb/',
  zenodoUrl: 'https://zenodo.org/communities/secimedfurb/',
  editorialBoard: [
    { role: 'Presidente', name: 'Maria Luiza Biz' },
    { role: 'Vice-Presidente', name: 'Maria Schorr Caesar' },
    { role: 'Trabalhos Científicos', name: 'Ana Laura Zardo' },
    { role: 'Trabalhos Científicos', name: 'Betina Dias' },
    { role: 'Responsável Editorial', name: 'Centro Acadêmico de Medicina de Blumenau — CAMBLU' },
  ],
  evaluationCriteria: [
    'Estrutura geral e adequação às normas do edital (ABNT)',
    'Clareza do tema e delimitação dos objetivos',
    'Fundamentação teórica e revisão de literatura',
    'Adequação e clareza da metodologia',
    'Análise crítica e discussão dos resultados',
    'Coerência da conclusão com os objetivos propostos',
    'Correção da escrita acadêmica e terminologia científica',
    'Formatação e atualização das referências bibliográficas',
    'Originalidade, criticidade e autonomia intelectual',
    'Domínio e clareza na apresentação oral (quando aplicável)',
  ],
};

export const CAMBLU_MULHER_INFO = {
  intro:
    'Canal seguro, acolhedor, respeitoso e sem julgamentos criado para que qualquer acadêmico de Medicina da FURB possa relatar situações desagradáveis, ofensivas ou de violência.',
  confidentiality:
    'Os relatos enviados como CAMBLU Mulher são acessados exclusivamente por duas integrantes mulheres da atual gestão do CAMBLU, com opção de anonimato total.',
  emergencyNumbers: [
    { label: 'Central de Atendimento à Mulher', value: 'Ligue 180 (24h gratuito)' },
    { label: 'SAVS Blumenau (Rua Dois de Setembro, 1212 · 1º andar)', value: '(47) 3381-7684 · Plantão (47) 99628-2019 (7h–19h seg–sex; após, Hospital Santo Antônio)' },
    { label: 'DCE Mulher (apoio psicológico e jurídico)', value: 'Atendimento estudantil FURB' },
    { label: 'Coletivos de apoio em Blumenau', value: 'Instituto Feminista Nísia Floresta, Instituto Bia Wachholz e Casa Abrigo Elisa' },
  ],
  violenceTypes: [
    {
      title: 'Física',
      summary: 'Qualquer conduta que ofenda a integridade ou saúde corporal (agressões, empurrões, estrangulamento, lesões).',
    },
    {
      title: 'Psicológica',
      summary: 'Dano emocional, diminuição da autoestima, ameaças, humilhação, perseguição, isolamento ou gaslighting.',
    },
    {
      title: 'Sexual',
      summary: 'Constrangimento a presenciar, manter ou participar de ato sexual não desejado mediante ameaça, intimidação ou coação.',
    },
    {
      title: 'Patrimonial',
      summary: 'Retenção, subtração ou destruição de objetos, documentos pessoais, bens, instrumentos de estudo/trabalho ou recursos.',
    },
    {
      title: 'Moral',
      summary: 'Qualquer conduta que configure calúnia, difamação ou injúria contra a dignidade da vítima.',
    },
  ],
};
