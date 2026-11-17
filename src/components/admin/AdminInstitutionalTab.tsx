import { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../ToastProvider';
import { Icon } from '../Icon';
import { ImageCropper1x1 } from './ImageCropper1x1';
import { GESTAO_CARGO_OPTIONS } from '../../data/gestoes';
import { M3_SHAPE_ROTATION } from '../ExpressiveShapeFrame';
import type { AnaisEdition, EditalItem, GestaoCargo, GestaoTerm, LigaAcademica, M3ShapeVariant } from '../../types/domain';

export function AdminInstitutionalTab() {
  const { gestoes, editais, anais, ligas, demands, saveGestao, saveEdital, deleteEdital, saveAnais, saveLiga } =
    useAppData();
  const { notify } = useToast();

  // Gestão member form (10.1)
  const [selectedGestaoId, setSelectedGestaoId] = useState(gestoes[0]?.id || 'gestao-2026');
  const [memberName, setMemberName] = useState('');
  const [memberCargo, setMemberCargo] = useState<GestaoCargo>('Diretoria de Eventos');
  const [memberInsta, setMemberInsta] = useState('');
  const [memberShape, setMemberShape] = useState<M3ShapeVariant>('squircle');
  const [memberPhoto, setMemberPhoto] = useState('');

  // New term
  const [newTermYear, setNewTermYear] = useState(2027);
  const [newTermChapa, setNewTermChapa] = useState('');

  // Edital form (7)
  const [edTitle, setEdTitle] = useState('');
  const [edProgram, setEdProgram] = useState<EditalItem['program']>('E-PAF');
  const [edStatus, setEdStatus] = useState<EditalItem['status']>('aberto');
  const [edDeadline, setEdDeadline] = useState('2026-12-20');
  const [edPdfUrl, setEdPdfUrl] = useState('');
  const [edFormsUrl, setEdFormsUrl] = useState('');
  const [edSummary, setEdSummary] = useState('');

  // Anais SECIMED form (12.1)
  const [anaisTitle, setAnaisTitle] = useState('');
  const [anaisYear, setAnaisYear] = useState(2026);
  const [anaisPdf, setAnaisPdf] = useState('');
  const [anaisSummary, setAnaisSummary] = useState('');

  // Liga form (11)
  const [ligaAcronym, setLigaAcronym] = useState('');
  const [ligaName, setLigaName] = useState('');
  const [ligaArea, setLigaArea] = useState<LigaAcademica['area']>('Clínica');
  const [ligaInsta, setLigaInsta] = useState('');

  const activeGestao = gestoes.find((g) => g.id === selectedGestaoId) || gestoes[0];

  const handleAddGestaoMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGestao || !memberName.trim()) return;
    const next: GestaoTerm = {
      ...activeGestao,
      members: [
        ...activeGestao.members,
        {
          id: `gm-${Date.now().toString(36)}`,
          name: memberName.trim(),
          cargo: memberCargo,
          instagram: memberInsta.trim() || undefined,
          photoUrl:
            memberPhoto ||
            `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#0f3325"/><text x="100" y="114" text-anchor="middle" font-family="sans-serif" font-size="68" font-weight="800" fill="#edd16e">${memberName.trim()[0].toUpperCase()}</text></svg>`,
            )}`,
          shape: memberShape,
        },
      ],
    };
    await saveGestao(next);
    setMemberName('');
    setMemberInsta('');
    setMemberPhoto('');
    notify('Integrante adicionado à gestão com recorte 1:1!');
  };

  const handleCreateTerm = async () => {
    if (!newTermChapa.trim()) return;
    const term: GestaoTerm = {
      id: `gestao-${newTermYear}-${Date.now().toString(36)}`,
      year: newTermYear,
      chapaName: newTermChapa.trim(),
      members: [],
    };
    await saveGestao(term);
    setSelectedGestaoId(term.id);
    setNewTermChapa('');
    notify(`Gestão ${newTermChapa} (${newTermYear}) criada!`);
  };

  const handleSaveEdital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edTitle.trim()) return;
    await saveEdital({
      id: `ed-${Date.now().toString(36)}`,
      title: edTitle.trim(),
      program: edProgram,
      status: edStatus,
      deadline: edDeadline,
      pdfUrl: edPdfUrl.trim() || 'https://www.camblu.org/editais',
      formsUrl: edFormsUrl.trim() || 'https://docs.google.com/forms/',
      summary: edSummary.trim() || 'Confira o edital oficial e envie a documentação pelo formulário.',
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    setEdTitle('');
    setEdSummary('');
    notify('Edital publicado!');
  };

  const handleSaveAnais = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anaisTitle.trim()) return;
    const rec: AnaisEdition = {
      id: `anais-${Date.now().toString(36)}`,
      editionTitle: anaisTitle.trim(),
      year: anaisYear,
      issn: '3086-612X',
      summary: anaisSummary.trim() || 'Anais publicados em acesso aberto sob licença CC BY-NC 4.0.',
      pdfUrl: anaisPdf.trim() || 'https://zenodo.org/communities/secimedfurb/',
      zenodoUrl: 'https://zenodo.org/communities/secimedfurb/',
      publishedAt: new Date().toISOString().slice(0, 10),
    };
    await saveAnais(rec);
    setAnaisTitle('');
    setAnaisSummary('');
    notify('Anais publicados em /secimed/anais-secimed!');
  };

  const handleAddLiga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ligaAcronym.trim() || !ligaName.trim()) return;
    const handle = ligaInsta.trim().startsWith('@') ? ligaInsta.trim() : `@${ligaInsta.trim()}`;
    await saveLiga({
      id: ligaAcronym.toLowerCase().replace(/[^a-z0-9]/g, ''),
      acronym: ligaAcronym.trim().toUpperCase(),
      name: ligaName.trim(),
      area: ligaArea,
      instagramHandle: handle,
      instagramUrl: `https://www.instagram.com/${handle.replace('@', '')}/`,
      shape: 'squircle',
    });
    setLigaAcronym('');
    setLigaName('');
    setLigaInsta('');
    notify('Liga acadêmica salva no catálogo!');
  };

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Gestões + Cropper 1:1 (10.1) */}
      <article className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <h2>Histórico de Gestões & Cortador 1:1</h2>
          <select
            className="m3-select"
            style={{ inlineSize: 'auto' }}
            value={selectedGestaoId}
            onChange={(e) => setSelectedGestaoId(e.target.value)}
            aria-label="Selecionar gestão"
          >
            {gestoes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.year} — {g.chapaName} ({g.members.length} membros)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'end' }}>
          <div className="m3-field">
            <label htmlFor="term-yr">Novo ano</label>
            <input
              id="term-yr"
              type="number"
              className="m3-input"
              style={{ inlineSize: '7rem' }}
              value={newTermYear}
              onChange={(e) => setNewTermYear(Number(e.target.value))}
            />
          </div>
          <div className="m3-field" style={{ flex: '1 1 14rem' }}>
            <label htmlFor="term-name">Nome da nova Chapa/Gestão</label>
            <input
              id="term-name"
              className="m3-input"
              placeholder="Ex.: Gestão Inovação"
              value={newTermChapa}
              onChange={(e) => setNewTermChapa(e.target.value)}
            />
          </div>
          <button type="button" className="m3-btn m3-btn--outlined" onClick={handleCreateTerm}>
            Criar Gestão
          </button>
        </div>

        <form onSubmit={handleAddGestaoMember} style={{ display: 'grid', gap: '1rem' }}>
          <div className="grid-cards">
            <div className="m3-field">
              <label htmlFor="gm-name">Nome do integrante</label>
              <input id="gm-name" className="m3-input" required value={memberName} onChange={(e) => setMemberName(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="gm-cargo">Cargo (Dropdown)</label>
              <select
                id="gm-cargo"
                className="m3-select"
                value={memberCargo}
                onChange={(e) => setMemberCargo(e.target.value as GestaoCargo)}
              >
                {GESTAO_CARGO_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="m3-field">
              <label htmlFor="gm-insta">Instagram (opcional)</label>
              <input
                id="gm-insta"
                className="m3-input"
                placeholder="@usuario"
                value={memberInsta}
                onChange={(e) => setMemberInsta(e.target.value)}
              />
            </div>
            <div className="m3-field">
              <label htmlFor="gm-shape">Moldura M3 Expressive</label>
              <select
                id="gm-shape"
                className="m3-select"
                value={memberShape}
                onChange={(e) => setMemberShape(e.target.value as M3ShapeVariant)}
              >
                {M3_SHAPE_ROTATION.map((sh) => (
                  <option key={sh} value={sh}>
                    {sh}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ImageCropper1x1 onCropped={setMemberPhoto} />
          {memberPhoto && (
            <span className="m3-badge m3-badge--success" style={{ justifySelf: 'start' }}>
              <Icon name="check_circle" size={16} />
              Foto 1:1 pronta para salvar
            </span>
          )}

          <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
            <Icon name="person_add" size={18} />
            <span>Adicionar Integrante na {activeGestao?.chapaName}</span>
          </button>
        </form>
      </article>

      {/* Editais (7) & Anais SECIMED (12.1) */}
      <div className="grid-two">
        <form onSubmit={handleSaveEdital} className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
          <h2>Publicar Edital (PDF + Google Forms)</h2>
          <div className="m3-field">
            <label htmlFor="ed-title">Título do edital</label>
            <input id="ed-title" className="m3-input" required value={edTitle} onChange={(e) => setEdTitle(e.target.value)} />
          </div>
          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="ed-prog">Programa</label>
              <select id="ed-prog" className="m3-select" value={edProgram} onChange={(e) => setEdProgram(e.target.value as EditalItem['program'])}>
                {['E-PAF', 'E-PAATC', 'E-PAFLIEC', 'SECIMED', 'Eleições', 'Outro'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="m3-field">
              <label htmlFor="ed-st">Status</label>
              <select id="ed-st" className="m3-select" value={edStatus} onChange={(e) => setEdStatus(e.target.value as EditalItem['status'])}>
                <option value="aberto">Aberto</option>
                <option value="em_breve">Em breve</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>
          <div className="m3-field">
            <label htmlFor="ed-dead">Prazo final</label>
            <input id="ed-dead" type="date" className="m3-input" value={edDeadline} onChange={(e) => setEdDeadline(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-pdf">Link do PDF (Firebase Storage / Drive)</label>
            <input id="ed-pdf" type="url" className="m3-input" value={edPdfUrl} onChange={(e) => setEdPdfUrl(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-forms">Link do Google Forms (inscrição/documentos)</label>
            <input id="ed-forms" type="url" className="m3-input" value={edFormsUrl} onChange={(e) => setEdFormsUrl(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-sum">Resumo</label>
            <textarea id="ed-sum" className="m3-textarea" value={edSummary} onChange={(e) => setEdSummary(e.target.value)} />
          </div>
          <button type="submit" className="m3-btn m3-btn--filled">
            Publicar Edital
          </button>

          <div style={{ display: 'grid', gap: '0.4rem', marginBlockStart: '0.5rem' }}>
            {editais.map((ed) => (
              <div key={ed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                <span>{ed.title}</span>
                <button type="button" className="m3-icon-btn" aria-label={`Excluir ${ed.title}`} onClick={() => deleteEdital(ed.id)}>
                  <Icon name="delete" size={16} />
                </button>
              </div>
            ))}
          </div>
        </form>

        <form onSubmit={handleSaveAnais} className="m3-card" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
          <h2>Submeter Anais SECIMED (/secimed/anais-secimed)</h2>
          <div className="m3-field">
            <label htmlFor="an-title">Título da edição</label>
            <input id="an-title" className="m3-input" required value={anaisTitle} onChange={(e) => setAnaisTitle(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="an-year">Ano</label>
            <input id="an-year" type="number" className="m3-input" value={anaisYear} onChange={(e) => setAnaisYear(Number(e.target.value))} />
          </div>
          <div className="m3-field">
            <label htmlFor="an-pdf">URL do PDF completo dos Anais</label>
            <input id="an-pdf" type="url" className="m3-input" value={anaisPdf} onChange={(e) => setAnaisPdf(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="an-sum">Resumo editorial</label>
            <textarea id="an-sum" className="m3-textarea" value={anaisSummary} onChange={(e) => setAnaisSummary(e.target.value)} />
          </div>
          <button type="submit" className="m3-btn m3-btn--blue">
            Publicar Edição ({anais.length} publicadas)
          </button>
        </form>
      </div>

      {/* Ligas & Log de Demandas */}
      <div className="grid-two">
        <form onSubmit={handleAddLiga} className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
          <h2>Adicionar Liga Acadêmica ({ligas.length})</h2>
          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="lg-acr">Sigla</label>
              <input id="lg-acr" className="m3-input" required value={ligaAcronym} onChange={(e) => setLigaAcronym(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="lg-area">Área</label>
              <select id="lg-area" className="m3-select" value={ligaArea} onChange={(e) => setLigaArea(e.target.value as LigaAcademica['area'])}>
                {['Clínica', 'Cirúrgica', 'Saúde Coletiva & Mental', 'Pediatria & GO', 'Diagnóstico & Básicas'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="m3-field">
            <label htmlFor="lg-name">Nome completo</label>
            <input id="lg-name" className="m3-input" required value={ligaName} onChange={(e) => setLigaName(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="lg-insta">Instagram</label>
            <input id="lg-insta" className="m3-input" placeholder="@ligafurb" value={ligaInsta} onChange={(e) => setLigaInsta(e.target.value)} />
          </div>
          <button type="submit" className="m3-btn m3-btn--filled">Salvar Liga</button>
        </form>

        <article className="m3-card" style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
          <h2>Últimas Demandas Registradas ({demands.length})</h2>
          {demands.length === 0 ? (
            <p className="text-muted">Nenhuma demanda registrada nesta sessão ainda.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {demands.map((d) => (
                <div key={d.id} className="m3-card m3-card--tonal" style={{ padding: '0.85rem' }}>
                  <span className="m3-badge m3-badge--blue" style={{ marginBlockEnd: '0.25rem' }}>{d.topic}</span>
                  <p>{d.message}</p>
                  <span className="m3-body-medium" style={{ fontSize: '0.78rem' }}>
                    {d.anonymous ? 'Anônimo' : d.senderName || d.senderEmail} · {d.createdAt.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
