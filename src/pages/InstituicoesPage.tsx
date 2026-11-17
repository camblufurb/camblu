import cambluLogoUrl from '../../assets/logos/logo_color.png';
import dceLogoUrl from '../../assets/logos/dce.jpg';
import aaarihLogoUrl from '../../assets/logos/aaarih.jpg';
import ifmsaLogoUrl from '../../assets/logos/ifmsa.png';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';

const CAMBLU_STATUTORY_PILLARS = [
  'Promover debates, palestras, grupos de discussão, seminários, jornadas, eventos culturais e esportivos.',
  'Fiscalizar e garantir a atualização do acervo necessário aos estudantes de Medicina.',
  'Divulgar, adquirir e elaborar meios de comunicação que contribuam para a formação acadêmica.',
  'Promover e incentivar a formação ética, crítica, moral, humanística, científica e política.',
  'Manter contato constante com entidades representativas estudantis em âmbito nacional e internacional.',
  'Lutar pelo aperfeiçoamento permanente do curso e pela indissociabilidade entre ensino, pesquisa e extensão.',
  'Promover a aproximação e solidariedade entre corpo docente, discente e administrativo da FURB.',
  'Fomentar espaços democráticos semanais abertos a todos os estudantes de Medicina da FURB.',
];

const AAARIH_ACTIVITIES = [
  {
    title: 'Sunset',
    desc: 'Recepção oficial dedicada aos novos estudantes de Medicina da FURB, com apresentação de cada calouro, apelido, plaquinha e entrega do kit de recepção.',
  },
  {
    title: 'Oktomed',
    desc: 'Tradicional evento de integração que precede a Oktoberfest em Blumenau, reunindo universitários de medicina de diversas regiões do país.',
  },
  {
    title: 'CopaMed',
    desc: 'Disputa semestral entre as turmas de Medicina FURB pelo troféu de futsal nas modalidades masculina e feminina.',
  },
  {
    title: 'Jogos Internos da Medicina (JIM)',
    desc: 'Competições interclasse realizadas no segundo semestre seguindo modalidades do Intermed Sul: esportes coletivos, atletismo, natação, tênis de mesa e jogos de mesa.',
  },
  {
    title: 'Treinos Semanais',
    desc: 'Modalidades contínuas de handebol, futsal, voleibol, basquete, judô e atletismo para integração, bem-estar e preparação das seleções.',
  },
  {
    title: 'JUMED/SC & Intermed Sul',
    desc: 'Jogos Universitários de Medicina de SC (idealizados pela AAARIH) e o maior congresso desportivo das Medicinas do Sul do Brasil (SC e RS).',
  },
];

const IFMSA_COMMITTEES = [
  {
    acronym: 'SCOME',
    fullName: 'Standing Committee on Medical Education',
    summary:
      'Atua em educação médica e demandas estudantis frente a lacunas curriculares, promovendo cursos como neuroanatomia aplicada à clínica.',
  },
  {
    acronym: 'SCOPH',
    fullName: 'Standing Committee on Public Health',
    summary:
      'Ações de saúde pública na universidade e na comunidade, incluindo rodas de conversa com idosos, Correio Sorriso e Hospital do Ursinho.',
  },
  {
    acronym: 'SCORA',
    fullName: 'Standing Committee on Sexual and Reproductive Health & HIV/AIDS',
    summary:
      'Educação sexual com adolescentes, testagem rápida de ISTs e campanhas educativas como as ações do Outubro Rosa.',
  },
  {
    acronym: 'SCORP',
    fullName: 'Standing Committee on Human Rights and Peace',
    summary:
      'Promoção dos direitos humanos e cultura de paz, abordando enfrentamento à violência no sistema de saúde e inclusão de minorias.',
  },
  {
    acronym: 'Intercâmbio',
    fullName: 'SCOPE & SCORE',
    summary:
      'Organização de intercâmbios médicos nacionais e internacionais, tanto para alunos da FURB quanto para estudantes visitantes.',
  },
  {
    acronym: 'Capacity Building',
    fullName: 'Treinamentos & Habilidades',
    summary:
      'Capacitações contínuas para desenvolvimento pessoal, liderança acadêmica e aprimoramento curricular dos estudantes.',
  },
  {
    acronym: 'NUPEC',
    fullName: 'Núcleo de Pesquisa Científica',
    summary:
      'Apoio em metodologia e escrita acadêmica para incentivar projetos e produções científicas dentro do comitê local.',
  },
];

export function InstituicoesPage() {
  return (
    <section className="page-section container" style={{ display: 'grid', gap: '2.5rem' }}>
      {/* Hero */}
      <div className="m3-card m3-card--forest m3-motion-hero" style={{ display: 'grid', gap: '0.85rem' }}>
        <div className="m3-hero-copy" style={{ display: 'grid', gap: '0.75rem', maxInlineSize: '48rem' }}>
          <h1>Instituições da Medicina FURB</h1>
          <p style={{ color: '#dceddf' }}>
            Conheça as quatro instituições que estruturam a representação discente, o esporte universitário, a extensão
            humanitária e os direitos estudantis no curso de Medicina da FURB.
          </p>
        </div>
      </div>

      {/* Visão Geral Rápida com Logos Oficiais */}
      <div className="grid-cards">
        {[
          {
            id: 'camblu',
            href: '#inst-camblu',
            logo: cambluLogoUrl,
            bg: '#0f3325',
            name: 'CAMBLU',
            desc: 'Centro Acadêmico de Medicina de Blumenau — representação máxima do curso desde 1990.',
          },
          {
            id: 'dce',
            href: '#inst-dce',
            logo: dceLogoUrl,
            bg: '#141414',
            name: 'DCE FURB',
            desc: 'Diretório Central dos Estudantes — representação universitária nos conselhos superiores.',
          },
          {
            id: 'aaarih',
            href: '#inst-aaarih',
            logo: aaarihLogoUrl,
            bg: '#1c120d',
            name: 'AAARIH',
            desc: 'Associação Atlética Acadêmica Romualdo Izon Heil — desporto, filantropia e integração.',
          },
          {
            id: 'ifmsa',
            href: '#inst-ifmsa',
            logo: ifmsaLogoUrl,
            bg: '#124076',
            name: 'IFMSA Brazil FURB',
            desc: 'Comitê local ligado à maior federação internacional de estudantes de medicina.',
          },
        ].map((inst, idx) => (
          <a
            key={inst.id}
            href={inst.href}
            className="m3-card m3-card--interactive m3-motion-stagger"
            style={
              {
                '--stagger-i': idx,
                textDecoration: 'none',
                color: 'inherit',
                display: 'grid',
                gap: '0.85rem',
                placeItems: 'start',
              } as React.CSSProperties
            }
          >
            <div
              style={{
                inlineSize: '4.5rem',
                blockSize: '4.5rem',
                borderRadius: 'var(--md-sys-shape-corner-md)',
                overflow: 'hidden',
                background: inst.bg,
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <img
                src={inst.logo}
                alt={`Logo ${inst.name}`}
                style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <h2 style={{ marginBlockEnd: '0.3rem' }}>{inst.name}</h2>
              <p className="text-muted">{inst.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* 1. CAMBLU */}
      <article
        id="inst-camblu"
        className="m3-card m3-motion-from-start"
        style={{ display: 'grid', gap: '1.25rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.15rem' }}>
          <img
            src={cambluLogoUrl}
            alt="Logo oficial do CAMBLU"
            style={{
              inlineSize: '5.5rem',
              blockSize: '5.5rem',
              borderRadius: '9999px',
              objectFit: 'cover',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          />
          <div>
            <h2>Centro Acadêmico de Medicina de Blumenau — CAMBLU</h2>
            <p className="text-muted">
              Entidade máxima de representatividade dos acadêmicos de Medicina da FURB, regida por estatuto próprio.
            </p>
          </div>
        </div>

        <p>
          O CAMBLU atua diariamente em reuniões semanais abertas a todos os estudantes do curso para encaminhar demandas
          pedagógicas, zelar pela qualidade do ensino e fortalecer a vivência universitária.
        </p>

        <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.45rem' }}>
          {CAMBLU_STATUTORY_PILLARS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div>
          <a href="https://www.instagram.com/camblufurb/" target="_blank" rel="noreferrer" className="m3-btn m3-btn--tonal">
            <Icon name="open_in_new" size={18} />
            <span>Instagram @camblufurb</span>
          </a>
        </div>
      </article>

      {/* 2. DCE FURB */}
      <article
        id="inst-dce"
        className="m3-card m3-motion-from-end"
        style={{ display: 'grid', gap: '1.25rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.15rem' }}>
          <img
            src={dceLogoUrl}
            alt="Logo do Diretório Central dos Estudantes — DCE FURB"
            style={{
              inlineSize: '5.5rem',
              blockSize: '5.5rem',
              borderRadius: 'var(--md-sys-shape-corner-md)',
              objectFit: 'cover',
            }}
          />
          <div>
            <h2>Diretório Central dos Estudantes — DCE FURB</h2>
            <p className="text-muted">
              Representação sistêmica de todos os estudantes da universidade perante a Reitoria e os Conselhos
              Superiores.
            </p>
          </div>
        </div>

        <p>
          Enquanto o Centro Acadêmico (CA) atua de forma focal dentro do curso de Medicina, o DCE atua na esfera
          geral da universidade — instâncias complementares para garantir qualidade acadêmica e permanência estudantil.
        </p>

        <div className="grid-two">
          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.55rem' }}>
            <h3>O Centro Acadêmico (CAMBLU): Atuação Focal</h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.15rem', display: 'grid', gap: '0.35rem' }}>
              <li>Diálogo direto com coordenação e chefia de departamento sobre grades e avaliações.</li>
              <li>Promoção científica e cultural do curso (SECIMED, congressos internos e acolhimento).</li>
              <li>Articulação horizontal com demais Centros Acadêmicos da área da Saúde.</li>
            </ul>
          </div>

          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.55rem' }}>
            <h3>O DCE FURB: Atuação Sistêmica e Externa</h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.15rem', display: 'grid', gap: '0.35rem' }}>
              <li>Assento e voto no CONSUN e CONSEPE (orçamento, mensalidades, calendário e infraestrutura).</li>
              <li>Defesa de políticas de permanência: bolsas, editais de pesquisa/extensão e Universidade Gratuita.</li>
              <li>Emissão da Carteira de Identidade Estudantil (meia-entrada) e conexão com UCE e UNE.</li>
              <li>Pautas transversais do campus como segurança, iluminação e acessibilidade.</li>
            </ul>
          </div>
        </div>
      </article>

      {/* 3. AAARIH */}
      <article
        id="inst-aaarih"
        className="m3-card m3-motion-from-start"
        style={{ display: 'grid', gap: '1.25rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.15rem' }}>
          <img
            src={aaarihLogoUrl}
            alt="Logo da Associação Atlética Acadêmica Romualdo Izon Heil — AAARIH"
            style={{
              inlineSize: '5.5rem',
              blockSize: '5.5rem',
              borderRadius: '9999px',
              objectFit: 'cover',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          />
          <div>
            <h2>Associação Atlética Acadêmica Romualdo Izon Heil — AAARIH</h2>
            <p className="text-muted">
              Fundada em 2005, é o órgão desportivo oficial dos acadêmicos de Medicina da FURB e a maior Atlética do Sul.
            </p>
          </div>
        </div>

        <p>
          Além das competições esportivas e eventos tradicionais que unem todas as fases da Medicina FURB, a AAARIH
          organiza campanhas filantrópicas semestrais (doação de sangue, agasalho e alimentos), mantém a Bateria Fera
          e zela pelo Leão, mascote do curso.
        </p>

        <div className="grid-cards">
          {AAARIH_ACTIVITIES.map((act) => (
            <div key={act.title} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.4rem' }}>
              <h3>{act.title}</h3>
              <p className="text-muted">{act.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <a
            href="https://www.instagram.com/atleticamedfurb/"
            target="_blank"
            rel="noreferrer"
            className="m3-btn m3-btn--tonal"
          >
            <Icon name="open_in_new" size={18} />
            <span>Instagram @atleticamedfurb</span>
          </a>
        </div>
      </article>

      {/* 4. IFMSA Brazil FURB */}
      <article
        id="inst-ifmsa"
        className="m3-card m3-motion-from-end"
        style={{ display: 'grid', gap: '1.25rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.15rem' }}>
          <img
            src={ifmsaLogoUrl}
            alt="Logo da IFMSA Brazil FURB"
            style={{
              inlineSize: '5.5rem',
              blockSize: '5.5rem',
              borderRadius: 'var(--md-sys-shape-corner-md)',
              objectFit: 'cover',
            }}
          />
          <div>
            <h2>IFMSA Brazil FURB</h2>
            <p className="text-muted">
              International Federation of Medical Students’ Associations — presente em mais de 130 países sob o lema
              &ldquo;pense global, aja local&rdquo;.
            </p>
          </div>
        </div>

        <p>
          O comitê local da FURB forma estudantes de medicina mais humanizados por meio de sete núcleos temáticos
          interdependentes. A filiação ocorre semestralmente, e a participação nas atividades gera pontuação para
          intercâmbios médicos nacionais e internacionais.
        </p>

        <div className="grid-cards">
          {IFMSA_COMMITTEES.map((com) => (
            <div key={com.acronym} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.35rem' }}>
              <h3>{com.acronym}</h3>
              <span className="m3-label-small text-muted">{com.fullName}</span>
              <p className="text-muted">{com.summary}</p>
            </div>
          ))}
        </div>

        <div>
          <a
            href="https://www.instagram.com/ifmsabrazilfurb/"
            target="_blank"
            rel="noreferrer"
            className="m3-btn m3-btn--tonal"
          >
            <Icon name="open_in_new" size={18} />
            <span>Instagram @ifmsabrazilfurb</span>
          </a>
        </div>
      </article>

      <SponsorsStrip />
    </section>
  );
}
