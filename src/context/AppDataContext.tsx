import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, where, type Query } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { syncGoogleSheetTransparency } from '../lib/googleSheetsTransparency';
import { ANAIS_SEED, EDITAIS_SEED, EVENTS_SEED, ORDERS_SEED, PRODUCTS_SEED } from '../data/catalogSeeds';
import { GESTOES_SEED } from '../data/gestoes';
import { LIGAS_SEED } from '../data/ligas';
import { TRANSPARENCY_ENTRIES_SEED, TRANSPARENCY_META_SEED } from '../data/transparencySeed';
import type {
  AnaisEdition,
  CambluEvent,
  CertificateRecord,
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
  syncTransparencySheet: (customUrl?: string) => Promise<number>;
  saveEdital: (edital: EditalItem) => Promise<void>;
  deleteEdital: (id: string) => Promise<void>;
  saveAnais: (anais: AnaisEdition) => Promise<void>;
  saveGestao: (gestao: GestaoTerm) => Promise<void>;
  saveLiga: (liga: LigaAcademica) => Promise<void>;
  addDemand: (demand: DemandSubmission) => Promise<void>;
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
      return seed && ev.isSecimed && !ev.secimedPalette
        ? { ...ev, secimedPalette: seed.secimedPalette }
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

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        clean[key] = stripUndefinedDeep(val);
      }
    }
    return clean as T;
  }
  return value;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, allDemoUsers, profile } = useAuth();
  const [state, setState] = useState<AppDataState>(loadState);
  const [fbAdminMembers, setFbAdminMembers] = useState<UserProfile[]>([]);
  const lastAutoSyncUrlRef = useRef<string | null>(null);

  const persistDoc = useCallback(async (colName: string, id: string, data: object) => {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, colName, id), stripUndefinedDeep(data), { merge: true });
    }
  }, []);

  const syncTransparencySheet = useCallback(
    async (customUrl?: string): Promise<number> => {
      const targetUrl = (customUrl ?? state.transparencyMeta.spreadsheetUrl ?? '').trim();
      if (!targetUrl) return 0;

      const synced = await syncGoogleSheetTransparency(targetUrl);
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
        savedCategories: Array.from(
          new Set([...state.transparencyMeta.savedCategories, ...synced.savedCategories]),
        ).sort(),
        updatedAt: synced.lastSyncedAt,
      };

      setState((p) => ({
        ...p,
        transparencyEntries: synced.entries,
        transparencyMeta: nextMeta,
      }));

      if (isFirebaseConfigured && db && isAdmin) {
        await persistDoc('transparencyMeta', 'public', {
          driveMinutesUrl: nextMeta.driveMinutesUrl,
          spreadsheetUrl: nextMeta.spreadsheetUrl,
          lastSyncedAt: nextMeta.lastSyncedAt,
          savedCategories: nextMeta.savedCategories,
        });
        await persistDoc('transparencyMeta', 'config', nextMeta);
        await Promise.all(synced.entries.map((entry) => persistDoc('transparencyEntries', entry.id, entry)));
      }

      return synced.entries.length;
    },
    [isAdmin, persistDoc, state.transparencyMeta],
  );

  useEffect(() => {
    const url = state.transparencyMeta.spreadsheetUrl?.trim();
    if (!url || lastAutoSyncUrlRef.current === url) return;
    lastAutoSyncUrlRef.current = url;
    void syncTransparencySheet(url).catch(() => {
      // Keeps cached local/Firestore entries gracefully when offline or private
    });
  }, [state.transparencyMeta.spreadsheetUrl, syncTransparencySheet]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        // ignore storage limit
      }
    }
  }, [state]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const unsubs: (() => void)[] = [];
    const bindQuery = <K extends keyof AppDataState>(q: Query, key: K) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setState((prev) => ({ ...prev, [key]: list as AppDataState[K] }));
          }
        },
        () => {
          // keep local seed fallback if permissions restrict unauthenticated reads
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

    const unsubGestoes = onSnapshot(
      collection(db, 'gestoes'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GestaoTerm);
        const merged = [
          ...docs,
          ...GESTOES_SEED.filter((seed) => !docs.some((item) => item.id === seed.id)),
        ].sort((a, b) => b.year - a.year);
        setState((prev) => ({ ...prev, gestoes: merged }));
      },
      () => {},
    );
    unsubs.push(unsubGestoes);

    const unsubPublicMeta = onSnapshot(
      doc(db, 'transparencyMeta', 'public'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as Partial<TransparencyMeta>;
          setState((prev) => ({
            ...prev,
            transparencyMeta: {
              ...prev.transparencyMeta,
              driveMinutesUrl: d.driveMinutesUrl ?? prev.transparencyMeta.driveMinutesUrl,
              spreadsheetUrl: d.spreadsheetUrl ?? prev.transparencyMeta.spreadsheetUrl,
              lastSyncedAt: d.lastSyncedAt ?? prev.transparencyMeta.lastSyncedAt,
              savedCategories: d.savedCategories ?? prev.transparencyMeta.savedCategories,
            },
          }));
        }
      },
      () => {},
    );
    unsubs.push(unsubPublicMeta);

    const unsubMeta = onSnapshot(
      doc(db, 'transparencyMeta', 'config'),
      (snap) => {
        if (snap.exists()) {
          setState((prev) => ({
            ...prev,
            transparencyMeta: { ...prev.transparencyMeta, ...(snap.data() as Partial<TransparencyMeta>) },
          }));
        }
      },
      () => {},
    );
    unsubs.push(unsubMeta);

    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin) return;
    const unsubs: (() => void)[] = [];
    const bindAdminCol = <K extends keyof AppDataState>(colName: string, key: K) => {
      const unsub = onSnapshot(
        collection(db!, colName),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setState((prev) => ({ ...prev, [key]: list as AppDataState[K] }));
        },
        () => {},
      );
      unsubs.push(unsub);
    };

    bindAdminCol('events', 'events');
    bindAdminCol('products', 'products');
    bindAdminCol('tickets', 'tickets');
    bindAdminCol('certificates', 'certificates');
    bindAdminCol('orders', 'orders');
    bindAdminCol('demands', 'demands');

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setFbAdminMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
      },
      () => {},
    );
    unsubs.push(unsubUsers);

    return () => unsubs.forEach((u) => u());
  }, [isAdmin]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !profile?.uid || isAdmin) return;
    const unsubs: (() => void)[] = [];
    const bindUserQuery = <K extends keyof AppDataState>(q: Query, key: K) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setState((prev) => ({ ...prev, [key]: list as AppDataState[K] }));
        },
        () => {},
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
    },
    updateTransparencyMeta: async (meta) => {
      setState((p) => ({ ...p, transparencyMeta: meta }));
      await persistDoc('transparencyMeta', 'public', {
        driveMinutesUrl: meta.driveMinutesUrl,
        spreadsheetUrl: meta.spreadsheetUrl,
        lastSyncedAt: meta.lastSyncedAt,
        savedCategories: meta.savedCategories,
      });
      await persistDoc('transparencyMeta', 'config', meta);
    },
    syncTransparencySheet,
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
        gestoes: upsertArray(p.gestoes, gestao).sort((a, b) => b.year - a.year),
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
