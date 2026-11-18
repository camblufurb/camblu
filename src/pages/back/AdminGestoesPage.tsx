import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ImageCropper1x1 } from '../../components/admin/ImageCropper1x1';
import { M3_SHAPE_ROTATION } from '../../components/ExpressiveShapeFrame';
import { M3Dialog } from '../../components/M3Dialog';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { GESTAO_CARGO_OPTIONS, GESTOES_SEED } from '../../data/gestoes';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import type { GestaoCargo, GestaoMember, GestaoTerm, M3ShapeVariant } from '../../types/domain';

function buildInitialAvatarSvg(name: string): string {
  const initial = name.trim()[0]?.toUpperCase() || 'C';
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#0f3325"/><text x="100" y="114" text-anchor="middle" font-family="sans-serif" font-size="68" font-weight="800" fill="#edd16e">${initial}</text></svg>`,
  )}`;
}

function pickRandomShape(): M3ShapeVariant {
  return M3_SHAPE_ROTATION[Math.floor(Math.random() * M3_SHAPE_ROTATION.length)];
}

/**
 * Bulk member management for student administrations featuring a top creator card,
 * dropdown term selector, dotted '+' first-slot popup creator, and per-member popup editing.
 */
export function AdminGestoesPage() {
  const { gestoes, saveGestao } = useAppData();
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const seededOnceRef = useRef(false);

  const sortedGestoes = useMemo(() => [...gestoes].sort((a, b) => b.year - a.year), [gestoes]);
  const [selectedGestaoId, setSelectedGestaoId] = useState(sortedGestoes[0]?.id || 'gestao-2026');

  const [newTermYear, setNewTermYear] = useState(2027);
  const [newTermChapa, setNewTermChapa] = useState('');
  const [syncingSeeds, setSyncingSeeds] = useState(false);

  // Garante no Firestore a presença das gestões oficiais 2024 e 2026 mesmo após criação de novas chapas
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin || seededOnceRef.current) return;
    seededOnceRef.current = true;
    void (async () => {
      try {
        const snap = await getDocs(collection(db, 'gestoes'));
        const existingIds = new Set(snap.docs.map((d) => d.id));
        const missing = GESTOES_SEED.filter((seed) => !existingIds.has(seed.id));
        for (const term of missing) {
          await saveGestao(term);
        }
      } catch {
        // fallback local permanece visível via AppDataContext
      }
    })();
  }, [isAdmin, saveGestao]);

  // Popup modal state for adding or editing a member
  const [modalOpen, setModalOpen] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberCargo, setMemberCargo] = useState<GestaoCargo>('Diretoria de Eventos');
  const [memberInsta, setMemberInsta] = useState('');
  const [memberShape, setMemberShape] = useState<M3ShapeVariant>(() => pickRandomShape());
  const [memberPhoto, setMemberPhoto] = useState('');

  const activeGestao = sortedGestoes.find((g) => g.id === selectedGestaoId) || sortedGestoes[0];

  const openAddPopup = () => {
    setEditingMemberId(null);
    setMemberName('');
    setMemberCargo('Diretoria de Eventos');
    setMemberInsta('');
    setMemberShape(pickRandomShape());
    setMemberPhoto('');
    setModalOpen(true);
  };

  const openEditPopup = (member: GestaoMember) => {
    setEditingMemberId(member.id);
    setMemberName(member.name);
    setMemberCargo(member.cargo);
    setMemberInsta(member.instagram || '');
    setMemberShape(member.shape);
    setMemberPhoto(member.photoUrl);
    setModalOpen(true);
  };

  const handleSaveMemberPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGestao || !memberName.trim() || savingMember) return;

    const cleanInsta = memberInsta.trim();
    const resolvedMember: GestaoMember = {
      id: editingMemberId || `gm-${Date.now().toString(36)}`,
      name: memberName.trim(),
      cargo: memberCargo,
      ...(cleanInsta ? { instagram: cleanInsta } : {}),
      photoUrl: memberPhoto || buildInitialAvatarSvg(memberName),
      shape: memberShape,
    };

    const nextMembers = editingMemberId
      ? activeGestao.members.map((m) => (m.id === editingMemberId ? resolvedMember : m))
      : [...activeGestao.members, resolvedMember];

    setSavingMember(true);
    try {
      await saveGestao({ ...activeGestao, members: nextMembers });
      setModalOpen(false);
      notify(editingMemberId ? 'Integrante atualizado na gestão!' : 'Integrante adicionado com recorte 1:1!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Não foi possível salvar o integrante no Firestore.', 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeGestao || savingMember) return;
    setSavingMember(true);
    try {
      await saveGestao({
        ...activeGestao,
        members: activeGestao.members.filter((m) => m.id !== memberId),
      });
      setModalOpen(false);
      notify('Integrante removido da gestão.', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao remover integrante.', 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const handleCreateTerm = async () => {
    if (!newTermChapa.trim()) return;
    const term: GestaoTerm = {
      id: `gestao-${newTermYear}-${Date.now().toString(36)}`,
      year: newTermYear,
      chapaName: newTermChapa.trim(),
      members: [],
    };
    try {
      await saveGestao(term);
      setSelectedGestaoId(term.id);
      setNewTermChapa('');
      notify(`Gestão ${term.chapaName} (${newTermYear}) criada!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao criar gestão.', 'error');
    }
  };

  const handleSyncOfficialSeeds = async () => {
    if (syncingSeeds) return;
    setSyncingSeeds(true);
    try {
      for (const term of GESTOES_SEED) {
        await saveGestao(term);
      }
      notify('Gestões 2024 e 2026 sincronizadas a partir dos dados oficiais do camblu.org!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao sincronizar gestões no Firestore.', 'error');
    } finally {
      setSyncingSeeds(false);
    }
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Gestões (Edição em Lote)</h1>
        <p className="text-muted">
          Crie uma nova gestão no topo ou selecione uma gestão abaixo para editar os integrantes no popup (+).
        </p>
      </header>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Adicionar Nova Gestão</h2>
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
          <button type="button" className="m3-btn m3-btn--filled" onClick={handleCreateTerm}>
            <Icon name="add_circle" size={18} />
            <span>Criar Gestão</span>
          </button>
        </div>
      </article>

      <article className="m3-card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <h2>Gestão Selecionada</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="m3-select"
              style={{ inlineSize: 'auto', minInlineSize: 'min(100%, 16rem)' }}
              value={activeGestao?.id || ''}
              onChange={(e) => setSelectedGestaoId(e.target.value)}
              aria-label="Selecionar gestão"
            >
              {sortedGestoes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.year} — {g.chapaName} ({g.members.length} membros)
                </option>
              ))}
            </select>
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              onClick={handleSyncOfficialSeeds}
              disabled={syncingSeeds}
              title="Importar/atualizar Gestões 2024 e 2026 do camblu.org no Firestore"
            >
              <Icon name="sync" size={18} />
              <span>{syncingSeeds ? 'Sincronizando...' : 'Importar 2024 e 2026'}</span>
            </button>
          </div>
        </div>

        {/* Grade Bulk Edit: Primeiro item = Círculo pontilhado com + */}
        {activeGestao && (
          <div className="grid-cards">
            <button
              type="button"
              onClick={openAddPopup}
              className="m3-card m3-card--interactive"
              style={{
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: 'var(--camblu-action-blue)',
                background: 'var(--md-sys-color-surface-container-low)',
                display: 'grid',
                placeItems: 'center',
                gap: '0.6rem',
                padding: '1.5rem 1rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  inlineSize: '4.5rem',
                  blockSize: '4.5rem',
                  borderRadius: '9999px',
                  border: '2.5px dashed var(--camblu-action-blue)',
                  color: 'var(--camblu-action-blue)',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#ffffff',
                }}
              >
                <Icon name="add" size={32} />
              </span>
              <strong style={{ color: 'var(--camblu-action-blue)' }}>Adicionar Integrante</strong>
            </button>

            {activeGestao.members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => openEditPopup(member)}
                className="m3-card m3-card--interactive"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  gap: '0.55rem',
                  padding: '1.15rem 0.9rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  style={{
                    inlineSize: '4.5rem',
                    blockSize: '4.5rem',
                    borderRadius: '9999px',
                    objectFit: 'cover',
                    border: '2px solid var(--md-sys-color-outline-variant)',
                  }}
                />
                <div style={{ display: 'grid', gap: '0.15rem' }}>
                  <strong style={{ fontSize: '0.96rem' }}>{member.name}</strong>
                  <span className="m3-badge" style={{ justifySelf: 'center' }}>{member.cargo}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </article>

      {/* Popup Adicionar / Editar Membro */}
      <M3Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMemberId ? `Editar ${memberName || 'Integrante'}` : `Adicionar na ${activeGestao?.chapaName || 'Gestão'}`}
        wide
      >
        <form onSubmit={handleSaveMemberPopup} style={{ display: 'grid', gap: '1rem' }}>
          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="gm-name">Nome do integrante</label>
              <input id="gm-name" className="m3-input" required value={memberName} onChange={(e) => setMemberName(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="gm-cargo">Cargo</label>
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
              <input id="gm-insta" className="m3-input" placeholder="@usuario" value={memberInsta} onChange={(e) => setMemberInsta(e.target.value)} />
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

          <ImageCropper1x1 key={editingMemberId || (modalOpen ? 'add' : 'closed')} onCropped={setMemberPhoto} />
          {memberPhoto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={memberPhoto}
                alt="Prévia da foto"
                style={{ inlineSize: '3.25rem', blockSize: '3.25rem', borderRadius: '9999px', objectFit: 'cover' }}
              />
              <span className="m3-badge m3-badge--success">
                <Icon name="check_circle" size={16} />
                Foto 1:1 selecionada
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {editingMemberId ? (
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                style={{ color: 'var(--md-sys-color-error)', borderColor: 'var(--md-sys-color-error)' }}
                onClick={() => handleRemoveMember(editingMemberId)}
              >
                <Icon name="delete" size={18} />
                <span>Remover Membro</span>
              </button>
            ) : (
              <span />
            )}

            <div style={{ display: 'flex', gap: '0.55rem' }}>
              <button type="button" className="m3-btn m3-btn--outlined" onClick={() => setModalOpen(false)} disabled={savingMember}>
                Cancelar
              </button>
              <button type="submit" className="m3-btn m3-btn--filled" disabled={savingMember}>
                <Icon name="save" size={18} />
                <span>{savingMember ? 'Salvando...' : editingMemberId ? 'Salvar Alterações' : 'Adicionar Integrante'}</span>
              </button>
            </div>
          </div>
        </form>
      </M3Dialog>
    </div>
  );
}
