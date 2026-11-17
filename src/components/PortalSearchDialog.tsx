import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { LIGAS_SEED } from '../data/ligas';
import { getProductSlug } from '../lib/shopHelpers';
import { Icon } from './Icon';
import { M3Dialog } from './M3Dialog';

interface SearchEntry {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  icon: string;
  keywords: string;
}

const STATIC_DIRECTORY: SearchEntry[] = [
  { id: 'home', title: 'Início', subtitle: 'Página principal do portal CAMBLU', to: '/', icon: 'home', keywords: 'inicio home portal' },
  { id: 'eventos', title: 'Eventos e Ingressos', subtitle: 'Simpósios, congressos e festas MEDFURB', to: '/eventos', icon: 'confirmation_number', keywords: 'eventos ingressos qr code' },
  { id: 'lojinha', title: 'Lojinha Oficial', subtitle: 'Moletons, camisetas, garrafas e acessórios', to: '/lojinha', icon: 'shopping_bag', keywords: 'lojinha loja produtos moletom camiseta' },
  { id: 'clube', title: 'Clube CAMBLU', subtitle: 'Assinatura de sócio, tiers e descontos', to: '/clube', icon: 'workspace_premium', keywords: 'clube socio desconto beneficio' },
  { id: 'medfurb', title: 'MEDFURB', subtitle: 'Curso, SAEME, infraestrutura, estágios e TCC', to: '/medfurb', icon: 'medical_services', keywords: 'medfurb saeme diretoria auxilio estagio tcc' },
  { id: 'instituicoes', title: 'Instituições Estudantis', subtitle: 'CAMBLU, DCE FURB, AAARIH e IFMSA Brazil', to: '/medfurb/instituicoes', icon: 'handshake', keywords: 'instituicoes dce aaarih ifmsa atletica' },
  { id: 'ligas', title: 'Ligas Acadêmicas', subtitle: 'Todas as ligas de Medicina da FURB', to: '/ligas', icon: 'biotech', keywords: 'ligas academicas pesquisa extensao' },
  { id: 'gestoes', title: 'Gestões', subtitle: 'Histórico das diretorias e membros do CAMBLU', to: '/gestoes', icon: 'groups', keywords: 'gestoes gestao diretoria membros' },
  { id: 'secimed', title: 'SECIMED', subtitle: 'Semana Científica de Medicina FURB', to: '/secimed', icon: 'science', keywords: 'secimed semana cientifica congresso' },
  { id: 'anais', title: 'Anais SECIMED', subtitle: 'Publicações científicas ISSN 3086-612X', to: '/secimed/anais-secimed', icon: 'menu_book', keywords: 'anais artigos issn publicacoes' },
  { id: 'calouro', title: 'Manual do Calouro', subtitle: 'Guia completo de recepção para ingressantes', to: '/manual-do-calouro', icon: 'school', keywords: 'manual calouro bixo recepcao' },
  { id: 'calendario', title: 'Calendário Acadêmico', subtitle: 'Datas oficiais de eventos e avaliações', to: '/calendario', icon: 'calendar_month', keywords: 'calendario datas agenda' },
  { id: 'editais', title: 'Editais', subtitle: 'E-PAF, E-PAATC, E-PAFLIEC e seleções', to: '/editais', icon: 'description', keywords: 'editais edital fomento auxilio' },
  { id: 'transparencia', title: 'Transparência e Atas', subtitle: 'Balancetes, receitas, despesas e atas', to: '/transparencia', icon: 'monitoring', keywords: 'transparencia financeiro atas balancete' },
  { id: 'demandas', title: 'Central de Demandas e Ajuda', subtitle: 'Ouvidoria, suporte discente e sugestões', to: '/demandas', icon: 'support_agent', keywords: 'demandas ajuda ouvidoria suporte contato' },
  { id: 'mulher', title: 'CAMBLU Mulher', subtitle: 'Coletivo de acolhimento e apoio estudantil', to: '/camblu-mulher', icon: 'shield_with_heart', keywords: 'camblu mulher acolhimento coletivo' },
  { id: 'sobre', title: 'Sobre e Espaços', subtitle: 'Sede CAMBLU, áreas de vivência e estatuto', to: '/sobre', icon: 'apartment', keywords: 'sobre espacos sede edificio cristina' },
  { id: 'meus-ingressos-hist', title: 'Histórico de Ingressos', subtitle: 'Suas compras e transferências de ingressos', to: '/meus-ingressos/historico', icon: 'history', keywords: 'historico compras ingressos transferencias' },
  { id: 'meus-pedidos', title: 'Compras na Lojinha', subtitle: 'Histórico de pedidos e entregas na Lojinha', to: '/meus-pedidos', icon: 'receipt_long', keywords: 'compras pedidos lojinha historico entregas' },
  { id: 'certificados', title: 'Certificados', subtitle: 'Emissão e validação por código único', to: '/certificados', icon: 'verified', keywords: 'certificados validar codigo' },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function PortalSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { events, products } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  const allEntries = useMemo<SearchEntry[]>(() => {
    const eventEntries: SearchEntry[] = events
      .filter((ev) => ev.published)
      .map((ev) => ({
        id: `ev-${ev.id}`,
        title: ev.title,
        subtitle: `Evento · ${ev.locationShort}`,
        to: `/eventos/${ev.slug}`,
        icon: 'event',
        keywords: `${ev.title} ${ev.locationShort} ${ev.category}`,
      }));

    const productEntries: SearchEntry[] = products
      .filter((prod) => prod.active)
      .map((prod) => ({
        id: `prod-${prod.id}`,
        title: prod.name,
        subtitle: `Lojinha · ${prod.category}`,
        to: `/lojinha/${getProductSlug(prod)}`,
        icon: 'shopping_bag',
        keywords: `${prod.name} ${prod.category} ${prod.description}`,
      }));

    const ligaEntries: SearchEntry[] = LIGAS_SEED.map((liga) => ({
      id: `liga-${liga.id}`,
      title: `${liga.acronym} — ${liga.name}`,
      subtitle: `Liga Acadêmica · ${liga.area}`,
      to: '/ligas',
      icon: 'biotech',
      keywords: `${liga.acronym} ${liga.name} ${liga.area}`,
    }));

    return [...STATIC_DIRECTORY, ...eventEntries, ...productEntries, ...ligaEntries];
  }, [events, products]);

  const results = useMemo(() => {
    const clean = normalizeText(query);
    if (!clean) return STATIC_DIRECTORY.slice(0, 8);
    return allEntries
      .filter((item) => normalizeText(`${item.title} ${item.subtitle} ${item.keywords}`).includes(clean))
      .slice(0, 10);
  }, [allEntries, query]);

  const handleSelect = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <M3Dialog open={open} onClose={onClose} title="Pesquisar no Portal" wide>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              insetInlineStart: '0.9rem',
              color: 'var(--camblu-action-blue)',
              pointerEvents: 'none',
              display: 'inline-flex',
            }}
          >
            <Icon name="search" size={20} />
          </span>
          <input
            ref={inputRef}
            type="search"
            className="m3-input"
            aria-label="Pesquisar páginas, eventos, produtos e ligas"
            placeholder="Buscar eventos, produtos da lojinha, ligas ou páginas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingInlineStart: '2.65rem' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '0.25rem', maxBlockSize: '55dvh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <p className="text-muted" style={{ padding: '0.75rem 0.5rem' }}>
              Nenhum resultado encontrado para “{query}”.
            </p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                className="dropdown-item"
                onClick={() => handleSelect(item.to)}
                style={{ justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minInlineSize: 0 }}>
                  <Icon name={item.icon} size={20} />
                  <span style={{ display: 'grid', gap: '0.1rem', minInlineSize: 0 }}>
                    <strong style={{ fontSize: '0.94rem', fontWeight: 650 }}>{item.title}</strong>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {item.subtitle}
                    </span>
                  </span>
                </span>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'inline-flex' }}>
                  <Icon name="arrow_forward" size={18} />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </M3Dialog>
  );
}
