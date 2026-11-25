import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where, writeBatch, type Query } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { logError, logInfo, logWarn } from '../lib/logger';
import { stripUndefinedDeep } from '../lib/objectUtils';
import { sortGestaoTermsDesc } from '../lib/gestoes';
import {
  fetchGoogleSheetAuditCsvs,
  requestGeminiTransparencyCategorization,
  requestMonthAuditWithGemini,
  syncGoogleSheetTransparency,
  type GeminiMonthAuditResult,
} from '../lib/googleSheetsTransparency';
import { ANAIS_SEED, EDITAIS_SEED, EVENTS_SEED, ORDERS_SEED, PRODUCTS_SEED } from '../data/catalogSeeds';
import { GESTOES_SEED } from '../data/gestoes';
import { LIGAS_SEED } from '../data/ligas';
import { TRANSPARENCY_ENTRIES_SEED, TRANSPARENCY_META_SEED } from '../data/transparencySeed';
import type {
  AnaisEdition,
  CambluEvent,
  CertificateRecord,
  ClubPromotion,
  DemandSubmission,
  EditalItem,
  GestaoTerm,
  LigaAcademica,
  ShopOrder,
  ShopProduct,
  Ticket,
  TransparencyEntry,
  TransparencyMeta,
  UserProfile,
} from '../types/domain';

const STORE_KEY = 'camblu.appdata.v1';

interface AppDataState {
  events: CambluEvent[];
  tickets: Ticket[];
  certificates: CertificateRecord[];
  products: ShopProduct[];
  orders: ShopOrder[];
  transparencyEntries: TransparencyEntry[];
  transparencyMeta: TransparencyMeta;
  editais: EditalItem[];
  anais: AnaisEdition[];
  gestoes: GestaoTerm[];
  ligas: LigaAcademica[];
  demands: DemandSubmission[];
  clubPromotions: ClubPromotion[];
}

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 'tkt-demo-secimed',
    eventId: 'evt-xxiii-secimed',
    eventSlug: 'xxiii-secimed-2026',
    eventTitle: 'XXIII SECIMED — Semana Científica de Medicina FURB',
    lotId: 'lot-secimed-1',
    lotName: '1º Lote Acadêmicos FURB',
    ownerUid: 'demo-student-1',
    ownerName: 'Marina Souza',
    ownerCpf: '52998224725',
    ownerEmail: 'marina.demo@furb.br',
    paidCents: 5850,
    discountReason: 'Desconto Clube Raro (10%)',
    status: 'valid',
    purchasedAt: '2026-10-05T14:00:00.000Z',
    transferHistory: [],
    qrInstances: [
      {
        qrCode: 'CAMBLU-SECIMED-D1-M98224',
        definitionId: 'qr-abertura',
        label: 'Abertura & Palestras Dia 1',
        dateTime: '2026-10-19T19:00:00-03:00',
        certificateHours: 4,
        checkedInAt: '2026-10-19T19:08:00-03:00',
        checkedInBy: 'camblufurb@gmail.com',
      },
      {
        qrCode: 'CAMBLU-SECIMED-WS-M98224',
        definitionId: 'qr-workshops',
        label: 'Workshops das Ligas Acadêmicas',
        dateTime: '2026-10-21T14:00:00-03:00',
        certificateHours: 6,
        checkedInAt: null,
      },
      {
        qrCode: 'CAMBLU-SECIMED-EN-M98224',
        definitionId: 'qr-encerramento',
        label: 'Apresentações Orais & Encerramento',
        dateTime: '2026-10-23T19:00:00-03:00',
        certificateHours: 5,
        checkedInAt: null,
      },
    ],
  },
  {
    id: 'tkt-demo-coffee-lucas',
    eventId: 'evt-simposio-coffee',
    eventSlug: 'simposio-emergencias-clinicas-coffee',
    eventTitle: 'Simpósio CAMBLU de Emergências Clínicas + Coffee Break',
    lotId: 'lot-simp-1',
    lotName: 'Lote Único (Inclui Coffee)',
    ownerUid: 'demo-student-2',
    ownerName: 'Lucas Pereira',
    ownerCpf: '39053344705',
    ownerEmail: 'lucas.demo@furb.br',
    paidCents: 0,
    discountReason: 'Gratuidade Clube Lendário (100%)',
    status: 'valid',
    purchasedAt: '2026-11-08T10:30:00.000Z',
    transferHistory: [],
    qrInstances: [
      {
        qrCode: 'CAMBLU-SIMP-L39053',
        definitionId: 'qr-simp-unico',
        label: 'Credenciamento Manhã + Coffee',
        dateTime: '2026-11-28T08:30:00-03:00',
        certificateHours: 4,
        checkedInAt: null,
      },
    ],
  },
  {
    id: 'tkt-demo-simposio-marina',
    eventId: 'evt-simposio-coffee',
    eventSlug: 'simposio-emergencias-clinicas-coffee',
    eventTitle: 'Simpósio CAMBLU de Emergências Clínicas + Coffee Break',
    lotId: 'lot-simp-1',
    lotName: 'Lote Único (Inclui Coffee)',
    ownerUid: 'demo-student-1',
    ownerName: 'Marina Souza',
    ownerCpf: '52998224725',
    ownerEmail: 'marina.demo@furb.br',
    paidCents: 0,
    discountReason: 'Gratuidade Clube Raro (100%)',
    status: 'valid',
    purchasedAt: '2026-11-12T09:15:00.000Z',
    transferHistory: [],
    qrInstances: [
      {
        qrCode: 'CAMBLU-SIMP-M52998',
        definitionId: 'qr-simp-unico',
        label: 'Credenciamento Manhã + Coffee',
        dateTime: '2026-11-28T08:30:00-03:00',
        certificateHours: 4,
        checkedInAt: null,
      },
    ],
  },
];

const DEFAULT_CERTIFICATES: CertificateRecord[] = [
  {
    id: 'cert-demo-1',
    code: 'CAMBLU-2026-SECIMED-0042',
    ticketId: 'tkt-demo-secimed',
    eventId: 'evt-xxiii-secimed',
    eventTitle: 'XXIII SECIMED — Semana Científica de Medicina FURB',
    eventDateLabel: '19 a 23 de outubro de 2026 · Blumenau/SC',
    ownerUid: 'demo-student-1',
    ownerName: 'Marina Souza',
    ownerCpf: '52998224725',
    totalHours: 4,
    issuedAt: '2026-10-24T12:00:00.000Z',
  },
];

const INITIAL_STATE: AppDataState = {
  events: EVENTS_SEED,
  tickets: DEFAULT_TICKETS,
  certificates: DEFAULT_CERTIFICATES,
  products: PRODUCTS_SEED,
  orders: ORDERS_SEED,
  transparencyEntries: TRANSPARENCY_ENTRIES_SEED,
  transparencyMeta: TRANSPARENCY_META_SEED,
  editais: EDITAIS_SEED,
  anais: ANAIS_SEED,
  gestoes: GESTOES_SEED,
  ligas: LIGAS_SEED,
  demands: [],
  clubPromotions: [],
};

interface AppDataContextValue extends AppDataState {
  adminMembers: UserProfile[];
  saveEvent: (event: CambluEvent) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  addTicket: (ticket: Ticket) => Promise<void>;
  updateTicket: (ticket: Ticket) => Promise<void>;
  upsertCertificate: (cert: CertificateRecord) => Promise<void>;
  saveProduct: (product: ShopProduct) => Promise<void>;
  addOrder: (order: ShopOrder) => Promise<void>;
  updateOrder: (order: ShopOrder) => Promise<void>;
  addTransparencyEntry: (entry: TransparencyEntry) => Promise<void>;
  deleteTransparencyEntry: (entryId: string) => Promise<void>;
  updateTransparencyMeta: (meta: TransparencyMeta) => Promise<void>;
  syncTransparencySheet: (customUrl?: string) => Promise<{
    count: number;
    categoriesCount: number;
    usedAi: boolean;
    warning?: string;
  }>;
  categorizeTransparencyWithGemini: () => Promise<{ count: number; categories: string[]; model: string }>;
  saveManualTransparencyCategories: (updates: Array<{ id: string; category: string }>) => Promise<void>;
  auditTransparencyMonth: (monthSheet: string) => Promise<GeminiMonthAuditResult>;
  applyTransparencyMonthFix: (
    monthSheet: string,
    proposedEntries: Array<{
      id: string;
      sheet: string;
      date: string;
      type: TransparencyEntry['type'];
      category: string;
      description: string;
      amountCents: number;
    }>,
  ) => Promise<TransparencyEntry[]>;
  saveEdital: (edital: EditalItem) => Promise<void>;
  deleteEdital: (id: string) => Promise<void>;
  saveAnais: (anais: AnaisEdition) => Promise<void>;
  saveGestao: (gestao: GestaoTerm) => Promise<void>;
  saveLiga: (liga: LigaAcademica) => Promise<void>;
  addDemand: (demand: DemandSubmission) => Promise<void>;
  saveClubPromotion: (promo: ClubPromotion) => Promise<void>;
  deleteClubPromotion: (id: string) => Promise<void>;
  resetDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function loadState(): AppDataState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppDataState>;
    const ligas = (parsed.ligas || LIGAS_SEED).map((l) => {
      if (l.logoUrl) return l;
      const seed = LIGAS_SEED.find((s) => s.id === l.id);
      return seed ? { ...l, logoUrl: seed.logoUrl } : l;
    });
    const products = (parsed.products || PRODUCTS_SEED).map((p) => {
      const seed = PRODUCTS_SEED.find((s) => s.id === p.id);
      if (!seed) return p;
      return {
        ...seed,
        ...p,
        slug: p.slug || seed.slug,
        colors: p.colors?.length ? p.colors : seed.colors,
        details: p.details?.length ? p.details : seed.details,
        careNotes: p.careNotes || seed.careNotes,
      };
    });
    const gestoes = (parsed.gestoes || GESTOES_SEED).map((g) => {
      const seedTerm = GESTOES_SEED.find((s) => s.id === g.id);
      if (!seedTerm) return g;
      return {
        ...g,
        members: g.members.map((m) => {
          if (m.photoUrl && !m.photoUrl.startsWith('data:image/svg+xml')) return m;
          const seedMember = seedTerm.members.find((sm) => sm.id === m.id);
          return seedMember ? { ...m, photoUrl: seedMember.photoUrl } : m;
        }),
      };
    });
    const tickets = parsed.tickets
      ? [
          ...parsed.tickets,
          ...DEFAULT_TICKETS.filter((dt) => !parsed.tickets!.some((t) => t.id === dt.id)),
        ]
      : DEFAULT_TICKETS;
    const events = (parsed.events || EVENTS_SEED).map((ev) => {
      const seed = EVENTS_SEED.find((s) => s.id === ev.id);
      const resolvedPalette = ev.palette || ev.secimedPalette || seed?.palette || seed?.secimedPalette;
      return resolvedPalette && !ev.palette
        ? { ...ev, palette: resolvedPalette, ...(ev.isSecimed ? { secimedPalette: resolvedPalette } : {}) }
        : ev;
    });
    const transparencyMeta: TransparencyMeta = {
      ...TRANSPARENCY_META_SEED,
      ...(parsed.transparencyMeta || {}),
      spreadsheetUrl: parsed.transparencyMeta?.spreadsheetUrl ?? TRANSPARENCY_META_SEED.spreadsheetUrl,
    };
    return { ...INITIAL_STATE, ...parsed, events, tickets, ligas, products, gestoes, transparencyMeta };
  } catch {
    return INITIAL_STATE;
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, allDemoUsers, profile } = useAuth();
  const [state, setState] = useState<AppDataState>(loadState);
  const [fbAdminMembers, setFbAdminMembers] = useState<UserProfile[]>([]);
  const lastAutoSyncUrlRef = useRef<string | null>(null);
  const backgroundAiAttemptedRef = useRef(false);

  const persistDoc = useCallback(async (colName: string, id: string, data: object) => {
    if (isFirebaseConfigured && db) {
      logInfo('Firestore', `Salvando documento ${colName}/${id}`);
      try {
        await setDoc(doc(db, colName, id), stripUndefinedDeep(data), { merge: true });
        logInfo('Firestore', `Documento ${colName}/${id} salvo com sucesso`);
      } catch (err) {
        logError('Firestore', `AppDataContext.persistDoc(${colName}/${id})`, err, { colName, id });
        throw err;
      }
    }
  }, []);

  const syncTransparencySheet = useCallback(
    async (customUrl?: string) => {
      const targetUrl = (customUrl ?? state.transparencyMeta.spreadsheetUrl ?? '').trim();
      if (!targetUrl) {
        return { count: 0, categoriesCount: 0, usedAi: false };
      }

      logInfo('Sheets', 'Iniciando sincronização da planilha de transparência', { targetUrl });
      const synced = await syncGoogleSheetTransparency(targetUrl);

      let finalEntries = synced.entries;
      let finalCategories = synced.savedCategories;
      let aiModel: string | undefined;
      let aiCategorizedAt: string | undefined;
      let usedAi = false;
      let warning: string | undefined;

      if (isFirebaseConfigured && db && isAdmin) {
        try {
          const aiRes = await requestGeminiTransparencyCategorization(synced.entries, {
            persist: true,
            meta: {
              spreadsheetUrl: targetUrl,
              lastSyncedAt: synced.lastSyncedAt,
              driveMinutesUrl: state.transparencyMeta.driveMinutesUrl,
              currentBalanceCents:
                synced.currentBalanceCents > 0
                  ? synced.currentBalanceCents
                  : state.transparencyMeta.currentBalanceCents,
              projectedBalanceCents:
                synced.projectedBalanceCents > 0
                  ? synced.projectedBalanceCents
                  : state.transparencyMeta.projectedBalanceCents,
              replaceSyncedSheetEntries: true,
            },
          });
          finalEntries = aiRes.entries;
          finalCategories = aiRes.categories;
          aiModel = aiRes.model;
          aiCategorizedAt = aiRes.categorizedAt || synced.lastSyncedAt;
          usedAi = true;
        } catch (err) {
          warning = err instanceof Error ? err.message : 'Gemini indisponível no momento.';
          logWarn('Gemini', 'Categorização Gemini falhou durante sync; salvando planilha com categorias padrão', err);
        }
      }

      const nextMeta: TransparencyMeta = {
        ...state.transparencyMeta,
        spreadsheetUrl: targetUrl,
        lastSyncedAt: synced.lastSyncedAt,
        currentBalanceCents:
          synced.currentBalanceCents > 0 ? synced.currentBalanceCents : state.transparencyMeta.currentBalanceCents,
        projectedBalanceCents:
          synced.projectedBalanceCents > 0
            ? synced.projectedBalanceCents
            : state.transparencyMeta.projectedBalanceCents,
        savedCategories: finalCategories,
        aiCategorizationModel: aiModel ?? state.transparencyMeta.aiCategorizationModel,
        aiCategorizedAt: aiCategorizedAt ?? state.transparencyMeta.aiCategorizedAt,
        updatedAt: synced.lastSyncedAt,
      };

      setState((p) => ({
        ...p,
        transparencyEntries: finalEntries,
        transparencyMeta: nextMeta,
      }));

      if (isFirebaseConfigured && db && isAdmin && !usedAi) {
        await persistDoc('transparencyMeta', 'public', {
          driveMinutesUrl: nextMeta.driveMinutesUrl,
          spreadsheetUrl: nextMeta.spreadsheetUrl,
          lastSyncedAt: nextMeta.lastSyncedAt,
          savedCategories: nextMeta.savedCategories,
        });
        await persistDoc('transparencyMeta', 'config', nextMeta);
        for (let i = 0; i < finalEntries.length; i += 400) {
          const batch = writeBatch(db);
          for (const entry of finalEntries.slice(i, i + 400)) {
            batch.set(doc(db, 'transparencyEntries', entry.id), stripUndefinedDeep(entry), { merge: true });
          }
          await batch.commit();
        }
      }

      return {
        count: finalEntries.length,
        categoriesCount: finalCategories.length,
        usedAi,
        warning,
      };
    },
    [isAdmin, persistDoc, state.transparencyMeta],
  );

  const categorizeTransparencyWithGemini = useCallback(async () => {
    const aiRes = await requestGeminiTransparencyCategorization(state.transparencyEntries, {
      persist: Boolean(isFirebaseConfigured && db && isAdmin),
      meta: {
        spreadsheetUrl: state.transparencyMeta.spreadsheetUrl,
        lastSyncedAt: state.transparencyMeta.lastSyncedAt,
        driveMinutesUrl: state.transparencyMeta.driveMinutesUrl,
        currentBalanceCents: state.transparencyMeta.currentBalanceCents,
        projectedBalanceCents: state.transparencyMeta.projectedBalanceCents,
      },
    });
    const categorizedAt = aiRes.categorizedAt || new Date().toISOString();
    setState((p) => ({
      ...p,
      transparencyEntries: aiRes.entries,
      transparencyMeta: {
        ...p.transparencyMeta,
        savedCategories: aiRes.categories,
        aiCategorizationModel: aiRes.model,
        aiCategorizedAt: categorizedAt,
        updatedAt: categorizedAt,
      },
    }));
    return {
      count: aiRes.entries.length,
      categories: aiRes.categories,
      model: aiRes.model,
    };
  }, [isAdmin, state.transparencyEntries, state.transparencyMeta]);

  const saveManualTransparencyCategories = useCallback(
    async (updates: Array<{ id: string; category: string }>) => {
      if (updates.length === 0) return;
      const updateMap = new Map<string, string>();
      for (const item of updates) {
        const cleanCat = item.category.trim();
        if (cleanCat) updateMap.set(item.id, cleanCat);
      }
      if (updateMap.size === 0) return;

      const updatedEntries = state.transparencyEntries.map((entry) => {
        const nextCat = updateMap.get(entry.id);
        return nextCat ? { ...entry, category: nextCat } : entry;
      });
      const nextCategories = Array.from(
        new Set(updatedEntries.map((e) => e.category).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      const updatedAt = new Date().toISOString();

      setState((p) => ({
        ...p,
        transparencyEntries: updatedEntries,
        transparencyMeta: {
          ...p.transparencyMeta,
          savedCategories: nextCategories,
          aiCategorizedAt: p.transparencyMeta.aiCategorizedAt || updatedAt,
          updatedAt,
        },
      }));

      if (isFirebaseConfigured && db && isAdmin) {
        const modified = updatedEntries.filter((e) => updateMap.has(e.id));
        for (let i = 0; i < modified.length; i += 400) {
          const batch = writeBatch(db);
          for (const entry of modified.slice(i, i + 400)) {
            batch.set(doc(db, 'transparencyEntries', entry.id), { category: entry.category }, { merge: true });
          }
          batch.set(
            doc(db, 'transparencyMeta', 'public'),
            { savedCategories: nextCategories, updatedAt },
            { merge: true },
          );
          batch.set(
            doc(db, 'transparencyMeta', 'config'),
            { savedCategories: nextCategories, updatedAt },
            { merge: true },
          );
          await batch.commit();
        }
      }
    },
    [isAdmin, state.transparencyEntries],
  );

  // Silent background categorization with Gemini when admin has entries without AI pass yet
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin) return;
    if (backgroundAiAttemptedRef.current) return;
    if (state.transparencyEntries.length === 0) return;
    if (state.transparencyMeta.aiCategorizedAt) return;
    backgroundAiAttemptedRef.current = true;
    void categorizeTransparencyWithGemini().catch((err) => {
      logWarn('Gemini', 'Categorização automática em segundo plano não pôde ser concluída', err);
    });
  }, [
    categorizeTransparencyWithGemini,
    isAdmin,
    state.transparencyEntries.length,
    state.transparencyMeta.aiCategorizedAt,
  ]);

  const auditTransparencyMonth = useCallback(
    async (monthSheet: string): Promise<GeminiMonthAuditResult> => {
      const sheetEntries = state.transparencyEntries.filter((e) => e.sheet === monthSheet);
      const sheetUrl = state.transparencyMeta.spreadsheetUrl?.trim() || '';
      let overviewCsv: string | undefined;
      let monthCsv: string | undefined;

      if (sheetUrl) {
        try {
          const csvs = await fetchGoogleSheetAuditCsvs(sheetUrl, monthSheet);
          overviewCsv = csvs.overviewCsv;
          monthCsv = csvs.monthCsv;
        } catch (err) {
          logWarn('Sheets', 'Não foi possível ler CSVs no cliente para auditoria; tentando no backend', err);
        }
      }

      return requestMonthAuditWithGemini({
        monthSheet,
        entries: sheetEntries,
        spreadsheetUrl: sheetUrl || undefined,
        overviewCsv,
        monthCsv,
      });
    },
    [state.transparencyEntries, state.transparencyMeta.spreadsheetUrl],
  );

  const applyTransparencyMonthFix = useCallback(
    async (
      monthSheet: string,
      proposedEntries: Array<{
        id: string;
        sheet: string;
        date: string;
        type: TransparencyEntry['type'];
        category: string;
        description: string;
        amountCents: number;
      }>,
    ): Promise<TransparencyEntry[]> => {
      const normalizedMonthEntries: TransparencyEntry[] = proposedEntries.map((item) => ({
        id: item.id,
        sheet: monthSheet,
        year: Number.parseInt(item.date.slice(0, 4), 10) || new Date().getFullYear(),
        date: item.date,
        type: item.type,
        category: item.category,
        description: item.description,
        amountCents: Math.abs(Math.round(item.amountCents)),
        createdAt: `${item.date}T12:00:00.000Z`,
      }));

      const prevMonthIds = new Set(
        state.transparencyEntries.filter((e) => e.sheet === monthSheet).map((e) => e.id),
      );
      const nextMonthIds = new Set(normalizedMonthEntries.map((e) => e.id));
      const updatedAll = [
        ...state.transparencyEntries.filter((e) => e.sheet !== monthSheet),
        ...normalizedMonthEntries,
      ];
      const nextCategories = Array.from(
        new Set(updatedAll.map((e) => e.category).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      const updatedAt = new Date().toISOString();

      setState((p) => ({
        ...p,
        transparencyEntries: updatedAll,
        transparencyMeta: {
          ...p.transparencyMeta,
          savedCategories: nextCategories,
          updatedAt,
        },
      }));

      if (isFirebaseConfigured && db && isAdmin) {
        const batch = writeBatch(db);
        prevMonthIds.forEach((oldId) => {
          if (!nextMonthIds.has(oldId)) {
            batch.delete(doc(db!, 'transparencyEntries', oldId));
          }
        });
        normalizedMonthEntries.forEach((entry) => {
          batch.set(doc(db!, 'transparencyEntries', entry.id), stripUndefinedDeep(entry), { merge: true });
        });
        batch.set(
          doc(db, 'transparencyMeta', 'public'),
          { savedCategories: nextCategories, updatedAt },
          { merge: true },
        );
        batch.set(
          doc(db, 'transparencyMeta', 'config'),
          { savedCategories: nextCategories, updatedAt },
          { merge: true },
        );
        await batch.commit();
      }

      return normalizedMonthEntries;
    },
    [isAdmin, state.transparencyEntries],
  );

  useEffect(() => {
    if (isFirebaseConfigured && db) return;
    const url = state.transparencyMeta.spreadsheetUrl?.trim();
    if (!url || lastAutoSyncUrlRef.current === url) return;
    lastAutoSyncUrlRef.current = url;
    void syncTransparencySheet(url).catch((err) => {
      logWarn('Sheets', 'Sincronização automática da planilha falhou; mantendo dados em cache demo', err);
    });
  }, [state.transparencyMeta.spreadsheetUrl, syncTransparencySheet]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (err) {
        logWarn('Storage', 'Limite de localStorage atingido ao salvar cache demo', err);
      }
    }
  }, [state]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    logInfo('Firestore', 'Assinando coleções públicas em tempo real');
    const unsubs: (() => void)[] = [];
    const bindQuery = <K extends keyof AppDataState>(q: Query, key: K) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          logInfo('Firestore', `Snapshot "${String(key)}" recebido`, { size: snap.size, empty: snap.empty });
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setState((prev) => ({ ...prev, [key]: list as AppDataState[K] }));
          }
        },
        (err) => {
          logError('Firestore', `AppDataContext.onSnapshot(${String(key)})`, err, { key: String(key) });
        },
      );
      unsubs.push(unsub);
    };

    bindQuery(query(collection(db, 'events'), where('published', '==', true)), 'events');
    bindQuery(query(collection(db, 'products'), where('active', '==', true)), 'products');
    bindQuery(collection(db, 'editais'), 'editais');
    bindQuery(collection(db, 'anais'), 'anais');
    bindQuery(collection(db, 'ligas'), 'ligas');
    bindQuery(collection(db, 'transparencyEntries'), 'transparencyEntries');
    bindQuery(collection(db, 'clubPromotions'), 'clubPromotions');

    const unsubGestoes = onSnapshot(
      collection(db, 'gestoes'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GestaoTerm);
        const merged = sortGestaoTermsDesc([
          ...docs,
          ...GESTOES_SEED.filter((seed) => !docs.some((item) => item.id === seed.id)),
        ]);
        logInfo('Firestore', 'Snapshot "gestoes" sincronizado com seed oficial', {
          firestoreCount: docs.length,
          mergedCount: merged.length,
        });
        setState((prev) => ({ ...prev, gestoes: merged }));
      },
      (err) => {
        logError('Firestore', 'AppDataContext.onSnapshot(gestoes)', err);
      },
    );
    unsubs.push(unsubGestoes);

    const unsubPublicMeta = onSnapshot(
      doc(db, 'transparencyMeta', 'public'),
      (snap) => {
        if (snap.exists()) {
          logInfo('Firestore', 'Documento transparencyMeta/public carregado');
          const d = snap.data() as Partial<TransparencyMeta>;
          setState((prev) => ({
            ...prev,
            transparencyMeta: {
              ...prev.transparencyMeta,
              driveMinutesUrl: d.driveMinutesUrl ?? prev.transparencyMeta.driveMinutesUrl,
              spreadsheetUrl: d.spreadsheetUrl ?? prev.transparencyMeta.spreadsheetUrl,
              lastSyncedAt: d.lastSyncedAt ?? prev.transparencyMeta.lastSyncedAt,
              savedCategories: d.savedCategories ?? prev.transparencyMeta.savedCategories,
              aiCategorizationModel: d.aiCategorizationModel ?? prev.transparencyMeta.aiCategorizationModel,
              aiCategorizedAt: d.aiCategorizedAt ?? prev.transparencyMeta.aiCategorizedAt,
            },
          }));
        }
      },
      (err) => {
        logError('Firestore', 'AppDataContext.onSnapshot(transparencyMeta/public)', err);
      },
    );
    unsubs.push(unsubPublicMeta);

    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin) return;
    logInfo('Firestore', 'Assinando coleções administrativas em tempo real (/back)');
    const unsubs: (() => void)[] = [];
    const bindAdminCol = <K extends keyof AppDataState>(colName: string, key: K) => {
      const unsub = onSnapshot(
        collection(db!, colName),
        (snap) => {
          logInfo('Firestore', `Snapshot admin "${colName}" recebido`, { size: snap.size });
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setState((prev) => ({ ...prev, [key]: list as AppDataState[K] }));
        },
        (err) => {
          logError('Firestore', `AppDataContext.bindAdminCol(${colName})`, err, { colName });
        },
      );
      unsubs.push(unsub);
    };

    bindAdminCol('events', 'events');
    bindAdminCol('products', 'products');
    bindAdminCol('tickets', 'tickets');
    bindAdminCol('certificates', 'certificates');
    bindAdminCol('orders', 'orders');
    bindAdminCol('demands', 'demands');

    const unsubMeta = onSnapshot(
      doc(db, 'transparencyMeta', 'config'),
      (snap) => {
        if (snap.exists()) {
          logInfo('Firestore', 'Documento transparencyMeta/config carregado');
          setState((prev) => ({
            ...prev,
            transparencyMeta: { ...prev.transparencyMeta, ...(snap.data() as Partial<TransparencyMeta>) },
          }));
        }
      },
      (err) => {
        logError('Firestore', 'AppDataContext.onSnapshot(transparencyMeta/config)', err);
      },
    );
    unsubs.push(unsubMeta);

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        logInfo('Firestore', 'Snapshot admin "users" recebido', { size: snap.size });
        setFbAdminMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
      },
      (err) => {
        logError('Firestore', 'AppDataContext.onSnapshot(users admin)', err);
      },
    );
    unsubs.push(unsubUsers);

    return () => unsubs.forEach((u) => u());
  }, [isAdmin]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !profile?.uid || isAdmin) return;
    logInfo('Firestore', 'Assinando coleções do estudante autenticado', { uid: profile.uid });
    const unsubs: (() => void)[] = [];
    const bindUserQuery = <K extends keyof AppDataState>(q: Query, key: K) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          logInfo('Firestore', `Snapshot usuário "${String(key)}" recebido`, { size: snap.size });
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setState((prev) => ({ ...prev, [key]: list as AppDataState[K] }));
        },
        (err) => {
          logError('Firestore', `AppDataContext.bindUserQuery(${String(key)})`, err, {
            key: String(key),
            uid: profile.uid,
          });
        },
      );
      unsubs.push(unsub);
    };

    bindUserQuery(query(collection(db, 'tickets'), where('ownerUid', '==', profile.uid)), 'tickets');
    bindUserQuery(query(collection(db, 'certificates'), where('ownerUid', '==', profile.uid)), 'certificates');
    bindUserQuery(query(collection(db, 'orders'), where('buyerUid', '==', profile.uid)), 'orders');

    return () => unsubs.forEach((u) => u());
  }, [profile?.uid, isAdmin]);

  const upsertArray = <T extends { id: string }>(arr: T[], item: T): T[] => {
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx === -1) return [item, ...arr];
    const copy = [...arr];
    copy[idx] = item;
    return copy;
  };

  const value: AppDataContextValue = {
    ...state,
    adminMembers: isFirebaseConfigured ? fbAdminMembers : allDemoUsers,
    saveEvent: async (event) => {
      setState((p) => ({ ...p, events: upsertArray(p.events, event) }));
      await persistDoc('events', event.id, event);
    },
    deleteEvent: async (eventId) => {
      setState((p) => ({ ...p, events: p.events.filter((e) => e.id !== eventId) }));
    },
    addTicket: async (ticket) => {
      setState((p) => ({ ...p, tickets: [ticket, ...p.tickets] }));
      await persistDoc('tickets', ticket.id, ticket);
    },
    updateTicket: async (ticket) => {
      setState((p) => ({ ...p, tickets: upsertArray(p.tickets, ticket) }));
      await persistDoc('tickets', ticket.id, ticket);
    },
    upsertCertificate: async (cert) => {
      setState((p) => ({ ...p, certificates: upsertArray(p.certificates, cert) }));
      await persistDoc('certificates', cert.id, cert);
    },
    saveProduct: async (product) => {
      setState((p) => ({ ...p, products: upsertArray(p.products, product) }));
      await persistDoc('products', product.id, product);
    },
    addOrder: async (order) => {
      setState((p) => {
        const products = p.products.map((prod) => {
          const orderedItems = order.items.filter((i) => i.productId === prod.id);
          if (orderedItems.length === 0) return prod;
          return {
            ...prod,
            sizes: prod.sizes.map((s) => {
              const matched = orderedItems.find((i) => i.size === s.size);
              if (!matched) return s;
              return { ...s, stock: Math.max(0, s.stock - matched.quantity) };
            }),
          };
        });
        return { ...p, orders: [order, ...p.orders], products };
      });
      await persistDoc('orders', order.id, order);
    },
    updateOrder: async (order) => {
      setState((p) => ({ ...p, orders: upsertArray(p.orders, order) }));
      await persistDoc('orders', order.id, order);
    },
    addTransparencyEntry: async (entry) => {
      setState((p) => {
        const savedCategories = Array.from(
          new Set([...p.transparencyMeta.savedCategories, entry.category].filter(Boolean)),
        ).sort();
        const delta = entry.type === 'receita' ? entry.amountCents : entry.type === 'despesa' ? -entry.amountCents : 0;
        const meta: TransparencyMeta = {
          ...p.transparencyMeta,
          currentBalanceCents: p.transparencyMeta.currentBalanceCents + delta,
          projectedBalanceCents: p.transparencyMeta.projectedBalanceCents + delta,
          savedCategories,
          updatedAt: new Date().toISOString(),
        };
        return {
          ...p,
          transparencyEntries: [entry, ...p.transparencyEntries],
          transparencyMeta: meta,
        };
      });
      await persistDoc('transparencyEntries', entry.id, entry);
    },
    deleteTransparencyEntry: async (entryId) => {
      setState((p) => ({
        ...p,
        transparencyEntries: p.transparencyEntries.filter((e) => e.id !== entryId),
      }));
      if (isFirebaseConfigured && db && isAdmin) {
        await deleteDoc(doc(db, 'transparencyEntries', entryId));
      }
    },
    updateTransparencyMeta: async (meta) => {
      setState((p) => ({ ...p, transparencyMeta: meta }));
      await persistDoc('transparencyMeta', 'public', {
        driveMinutesUrl: meta.driveMinutesUrl,
        spreadsheetUrl: meta.spreadsheetUrl,
        lastSyncedAt: meta.lastSyncedAt,
        savedCategories: meta.savedCategories,
        aiCategorizationModel: meta.aiCategorizationModel,
        aiCategorizedAt: meta.aiCategorizedAt,
      });
      await persistDoc('transparencyMeta', 'config', meta);
    },
    syncTransparencySheet,
    categorizeTransparencyWithGemini,
    saveManualTransparencyCategories,
    auditTransparencyMonth,
    applyTransparencyMonthFix,
    saveEdital: async (edital) => {
      setState((p) => ({ ...p, editais: upsertArray(p.editais, edital) }));
      await persistDoc('editais', edital.id, edital);
    },
    deleteEdital: async (id) => {
      setState((p) => ({ ...p, editais: p.editais.filter((e) => e.id !== id) }));
    },
    saveAnais: async (anais) => {
      setState((p) => ({ ...p, anais: upsertArray(p.anais, anais) }));
      await persistDoc('anais', anais.id, anais);
    },
    saveGestao: async (gestao) => {
      setState((p) => ({
        ...p,
        gestoes: sortGestaoTermsDesc(upsertArray(p.gestoes, gestao)),
      }));
      await persistDoc('gestoes', gestao.id, gestao);
    },
    saveLiga: async (liga) => {
      setState((p) => ({ ...p, ligas: upsertArray(p.ligas, liga) }));
      await persistDoc('ligas', liga.id, liga);
    },
    addDemand: async (demand) => {
      setState((p) => ({ ...p, demands: [demand, ...p.demands] }));
      await persistDoc('demands', demand.id, demand);
    },
    saveClubPromotion: async (promo) => {
      setState((p) => ({ ...p, clubPromotions: upsertArray(p.clubPromotions, promo) }));
      await persistDoc('clubPromotions', promo.id, promo);
    },
    deleteClubPromotion: async (id) => {
      setState((p) => ({
        ...p,
        clubPromotions: p.clubPromotions.filter((item) => item.id !== id),
      }));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'clubPromotions', id));
      }
    },
    resetDemoData: () => {
      localStorage.removeItem(STORE_KEY);
      setState(INITIAL_STATE);
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
