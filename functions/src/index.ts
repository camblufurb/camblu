import { initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import {
  CLUB_PRICE_MAP,
  computeEventPricing,
  computeShopPricing,
  getMembershipTierCode,
  MEMBERSHIP_TIER_NAME_MAP,
  type MembershipCycle,
  type MembershipTier,
} from './pricing.js';
import {
  buildEventSeoMeta,
  buildProductSeoMeta,
  escapeHtml,
  injectSeoIntoHtml,
  normalizePathname,
  PUBLIC_ROUTE_SEO_LIST,
  resolveStaticRouteSeo,
  type SeoMetaPayload,
} from './seo.js';
import {
  categorizeTransparencyEntriesWithGemini,
  GEMINI_CATEGORIZER_MODEL,
  type CategorizableTransparencyEntry,
  type TransparencyEntryDirection,
} from './transparencyCategorizer.js';
import { runTransparencyMonthAudit } from './transparencyAuditor.js';
import {
  generateProductImagesWithNanoBanana,
  type InlineImagePayload,
  type ProductAiShotRequest,
} from './productImageGenerator.js';
import { generateProductDescriptionWithFlashLite } from './productDescriptionGenerator.js';
import type { GeminiAuthInput } from './geminiClient.js';

initializeApp();
const db = getFirestore();
const authAdmin = getAuth();

const ADMIN_EMAIL = 'camblufurb@gmail.com';
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://camblu.web.app';
const ALLOWED_PUBLIC_ORIGINS = new Set([
  'https://camblu.web.app',
  'https://camblu.firebaseapp.com',
  'https://camblu.org',
  'https://www.camblu.org',
]);

function resolveSiteOrigin(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (forwardedHost) {
    const candidate = `https://${forwardedHost}`;
    if (ALLOWED_PUBLIC_ORIGINS.has(candidate)) {
      return candidate;
    }
  }
  return SITE_ORIGIN;
}

const stripeRestrictedKey = defineSecret('STRIPE_RESTRICTED_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const smtpPass = defineSecret('SMTP_PASS');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

let cachedStripe: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!cachedStripe) {
    cachedStripe = new Stripe(stripeRestrictedKey.value());
  }
  return cachedStripe;
}

function digitsOnly(v: string): string {
  return String(v || '').replace(/\D+/g, '');
}

function sanitizeHeaderString(v: unknown, maxLen = 140): string {
  return String(v || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function isMembershipCurrentlyValid(userData: {
  membershipActive?: boolean;
  membershipValidUntil?: string | null;
}): boolean {
  const validUntil = userData.membershipValidUntil || null;
  return Boolean(
    userData.membershipActive && (!validUntil || new Date(validUntil).getTime() > Date.now()),
  );
}

function isSafeEnrollmentPdfUrl(url: unknown, uid: string): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1500) return undefined;
  const encodedUid = encodeURIComponent(uid);
  const expectedPrefix = `https://firebasestorage.googleapis.com/v0/b/camblu.firebasestorage.app/o/enrollment-summaries%2F${encodedUid}%2F`;
  return trimmed.startsWith(expectedPrefix) ? trimmed : undefined;
}

async function verifyBearerToken(req: Request): Promise<DecodedIdToken | null> {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    return await authAdmin.verifyIdToken(token);
  } catch (err) {
    console.warn('[CAMBLU-API] Falha ao verificar token Bearer', {
      origin: 'functions -> verifyBearerToken',
      path: req.path,
      code: (err as { code?: string })?.code,
      message: (err as Error)?.message,
    });
    return null;
  }
}

const app = express();
app.use(cors({ origin: true }));
app.use((req: Request, res: Response, next) => {
  const startedAt = Date.now();
  console.info(`[CAMBLU-API] -> ${req.method} ${req.path}`);
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const logFn = res.statusCode >= 500 ? console.error : res.statusCode >= 400 ? console.warn : console.info;
    logFn(`[CAMBLU-API] <- ${req.method} ${req.path} status=${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

// Stripe Webhook MUST receive unparsed rawBody before express.json()
app.post('/api/stripe/webhook', async (req: Request & { rawBody?: Buffer }, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !req.rawBody) {
    console.warn('[CAMBLU-API] Webhook Stripe sem assinatura ou rawBody', {
      origin: 'functions -> /api/stripe/webhook',
      hasSig: Boolean(sig),
      hasRawBody: Boolean(req.rawBody),
    });
    res.status(400).send('Missing Stripe signature or raw body');
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value());
  } catch (err) {
    console.error('[CAMBLU-API] Erro ao validar assinatura webhook Stripe', {
      origin: 'functions -> /api/stripe/webhook -> constructEvent',
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(400).send(`Webhook verification failed: ${(err as Error).message}`);
    return;
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') {
        res.json({ received: true, pending: true });
        return;
      }

      const meta = session.metadata || {};
      const kind = meta.kind;
      const uid = meta.uid;

      if (kind === 'event_ticket' && uid && meta.eventId && meta.lotId) {
        const ticketId = `tkt-${session.id.slice(-14)}`;
        const ticketRef = db.collection('tickets').doc(ticketId);
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(ticketRef);
          if (existing.exists) return;
          const evSnap = await tx.get(db.collection('events').doc(meta.eventId));
          const userSnap = await tx.get(db.collection('users').doc(uid));
          if (!evSnap.exists || !userSnap.exists) return;

          const evData = evSnap.data()!;
          const userData = userSnap.data()!;
          const lots = (evData.lots || []) as Array<{
            id: string;
            name: string;
            soldQuantity: number;
            qrDefinitions: Array<{
              id: string;
              label: string;
              dateTime: string;
              certificateHours: number;
            }>;
          }>;
          const lot = lots.find((l) => l.id === meta.lotId);
          if (!lot) return;

          const updatedLots = lots.map((l) =>
            l.id === meta.lotId ? { ...l, soldQuantity: (l.soldQuantity || 0) + 1 } : l,
          );
          tx.update(evSnap.ref, { lots: updatedLots });
          tx.set(ticketRef, {
            id: ticketId,
            eventId: evSnap.id,
            eventSlug: evData.slug,
            eventTitle: evData.title,
            lotId: lot.id,
            lotName: lot.name,
            ownerUid: uid,
            ownerName: userData.name || '',
            ownerCpf: userData.cpf || '',
            ownerEmail: userData.email || '',
            paidCents: session.amount_total || 0,
            discountReason: meta.discountReason || '',
            status: 'valid',
            purchasedAt: new Date().toISOString(),
            transferHistory: [],
            qrInstances: (lot.qrDefinitions || []).map((q, idx) => ({
              qrCode: `CAMBLU-${String(evData.slug).slice(0, 8).toUpperCase()}-${idx + 1}-${ticketId.slice(-5).toUpperCase()}`,
              definitionId: q.id,
              label: q.label,
              dateTime: q.dateTime,
              certificateHours: q.certificateHours,
              checkedInAt: null,
            })),
          });
        });
      }

      if (kind === 'shop_order' && uid && meta.itemsJson) {
        const orderId = `ord-${session.id.slice(-14)}`;
        const orderRef = db.collection('orders').doc(orderId);
        const items = JSON.parse(meta.itemsJson) as Array<{
          productId: string;
          productName: string;
          size: string;
          quantity: number;
          unitPriceCents: number;
        }>;
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(orderRef);
          if (existing.exists) return;
          const userSnap = await tx.get(db.collection('users').doc(uid));
          const userData = userSnap.data() || {};

          for (const item of items) {
            const pRef = db.collection('products').doc(item.productId);
            const pSnap = await tx.get(pRef);
            if (!pSnap.exists) continue;
            const sizes = (pSnap.data()!.sizes || []) as Array<{ size: string; stock: number }>;
            const nextSizes = sizes.map((s) =>
              s.size === item.size ? { ...s, stock: Math.max(0, s.stock - item.quantity) } : s,
            );
            tx.update(pRef, { sizes: nextSizes });
          }

          tx.set(orderRef, {
            id: orderId,
            buyerUid: uid,
            buyerName: userData.name || '',
            buyerEmail: userData.email || '',
            buyerPhone: userData.phone || '',
            items,
            subtotalCents: Number(meta.subtotalCents || 0),
            discountCents: Number(meta.discountCents || 0),
            totalCents: session.amount_total || 0,
            paymentMethod: session.payment_method_types?.includes('pix') ? 'stripe_pix' : 'stripe_card',
            paymentStatus: 'paid',
            delivered: false,
            createdAt: new Date().toISOString(),
          });
        });
      }

      if (kind === 'club_membership' && uid && meta.tier && meta.cycle) {
        const months = meta.cycle === 'mensal' ? 1 : 6;
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + months);
        await db.collection('users').doc(uid).set(
          {
            membershipTier: meta.tier,
            membershipCycle: meta.cycle,
            membershipActive: true,
            membershipValidUntil: validUntil.toISOString(),
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            stripeSubscriptionId:
              typeof session.subscription === 'string' ? session.subscription : null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const snap = await db
        .collection('users')
        .where('stripeSubscriptionId', '==', sub.id)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          membershipActive: false,
          membershipTier: 'none',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'camblu-api' });
});

function getServerGeminiAuth(): GeminiAuthInput {
  return {
    mode: 'vertex-adc',
    projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'camblu',
  };
}

app.post('/api/transparency/categorize', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL || !decoded.email_verified) {
    res.status(403).json({ error: 'Apenas camblufurb@gmail.com pode categorizar a transparência.' });
    return;
  }

  const geminiAuth = getServerGeminiAuth();

  const body = (req.body || {}) as {
    entries?: Array<{
      id?: string;
      sheet?: string;
      year?: number;
      date?: string;
      type?: TransparencyEntryDirection;
      category?: string;
      description?: string;
      amountCents?: number;
      createdAt?: string;
    }>;
    persist?: boolean;
    meta?: {
      spreadsheetUrl?: string;
      lastSyncedAt?: string;
      driveMinutesUrl?: string;
      currentBalanceCents?: number;
      projectedBalanceCents?: number;
      replaceSyncedSheetEntries?: boolean;
    };
  };

  try {
    let sourceDocs: Array<{
      id: string;
      sheet: string;
      year: number;
      date: string;
      type: TransparencyEntryDirection;
      category: string;
      description: string;
      amountCents: number;
      createdAt: string;
    }> = [];

    if (Array.isArray(body.entries) && body.entries.length > 0) {
      if (body.entries.length > 800) {
        res.status(400).json({ error: 'Limite máximo de 800 lançamentos por solicitação.' });
        return;
      }
      sourceDocs = body.entries
        .filter((e) => e && e.id && e.description && typeof e.amountCents === 'number')
        .map((e) => {
          const date = String(e.date || new Date().toISOString().slice(0, 10));
          const type: TransparencyEntryDirection =
            e.type === 'receita' || e.type === 'despesa' || e.type === 'ativo' || e.type === 'passivo'
              ? e.type
              : 'despesa';
          return {
            id: sanitizeHeaderString(e.id, 120),
            sheet: sanitizeHeaderString(e.sheet || 'Geral', 60) || 'Geral',
            year: Number(e.year) || Number(date.slice(0, 4)) || new Date().getFullYear(),
            date: sanitizeHeaderString(date, 20),
            type,
            category: sanitizeHeaderString(e.category || '', 60),
            description: sanitizeHeaderString(e.description, 240),
            amountCents: Math.abs(Math.round(Number(e.amountCents) || 0)),
            createdAt: String(e.createdAt || `${date}T12:00:00.000Z`),
          };
        });
    } else {
      const snap = await db.collection('transparencyEntries').get();
      sourceDocs = snap.docs.map((d) => {
        const data = d.data();
        const date = String(data.date || new Date().toISOString().slice(0, 10));
        return {
          id: d.id,
          sheet: String(data.sheet || 'Geral'),
          year: Number(data.year) || Number(date.slice(0, 4)) || new Date().getFullYear(),
          date,
          type: (data.type as TransparencyEntryDirection) || 'despesa',
          category: String(data.category || ''),
          description: String(data.description || ''),
          amountCents: Math.abs(Number(data.amountCents) || 0),
          createdAt: String(data.createdAt || `${date}T12:00:00.000Z`),
        };
      });
    }

    const categorizable: CategorizableTransparencyEntry[] = sourceDocs.map((e) => ({
      id: e.id,
      sheet: e.sheet,
      date: e.date,
      type: e.type,
      description: e.description,
      amountCents: e.amountCents,
      category: e.category,
    }));

    const aiResult = await categorizeTransparencyEntriesWithGemini(categorizable, geminiAuth);
    const categorizedEntries = sourceDocs.map((entry) => ({
      ...entry,
      category: aiResult.assignments[entry.id] || entry.category || 'Administrativo & Financeiro',
    }));

    const shouldPersist = body.persist !== false;
    const categorizedAt = new Date().toISOString();

    if (shouldPersist) {
      const incomingIds = new Set(categorizedEntries.map((e) => e.id));
      const ops: Array<{ type: 'set'; id: string; data: Record<string, unknown> } | { type: 'delete'; id: string }> = [];

      if (body.meta?.replaceSyncedSheetEntries) {
        const existingSnap = await db.collection('transparencyEntries').get();
        existingSnap.docs.forEach((docSnap) => {
          if (docSnap.id.startsWith('gs-') && !incomingIds.has(docSnap.id)) {
            ops.push({ type: 'delete', id: docSnap.id });
          }
        });
      }

      categorizedEntries.forEach((entry) => {
        ops.push({ type: 'set', id: entry.id, data: entry });
      });

      for (let i = 0; i < ops.length; i += 400) {
        const batch = db.batch();
        const chunk = ops.slice(i, i + 400);
        for (const op of chunk) {
          const ref = db.collection('transparencyEntries').doc(op.id);
          if (op.type === 'delete') batch.delete(ref);
          else batch.set(ref, op.data, { merge: true });
        }
        await batch.commit();
      }

      const publicPatch: Record<string, unknown> = {
        savedCategories: aiResult.categories,
        aiCategorizationModel: GEMINI_CATEGORIZER_MODEL,
        aiCategorizedAt: categorizedAt,
        updatedAt: categorizedAt,
      };
      if (body.meta?.spreadsheetUrl) publicPatch.spreadsheetUrl = body.meta.spreadsheetUrl;
      if (body.meta?.lastSyncedAt) publicPatch.lastSyncedAt = body.meta.lastSyncedAt;
      if (body.meta?.driveMinutesUrl) publicPatch.driveMinutesUrl = body.meta.driveMinutesUrl;

      const configPatch: Record<string, unknown> = { ...publicPatch };
      if (
        typeof body.meta?.currentBalanceCents === 'number' &&
        Number.isFinite(body.meta.currentBalanceCents) &&
        body.meta.currentBalanceCents > 0
      ) {
        configPatch.currentBalanceCents = Math.round(body.meta.currentBalanceCents);
      }
      if (
        typeof body.meta?.projectedBalanceCents === 'number' &&
        Number.isFinite(body.meta.projectedBalanceCents) &&
        body.meta.projectedBalanceCents > 0
      ) {
        configPatch.projectedBalanceCents = Math.round(body.meta.projectedBalanceCents);
      }

      await Promise.all([
        db.collection('transparencyMeta').doc('public').set(publicPatch, { merge: true }),
        db.collection('transparencyMeta').doc('config').set(configPatch, { merge: true }),
      ]);
    }

    res.json({
      ok: true,
      model: aiResult.model,
      categories: aiResult.categories,
      assignments: aiResult.assignments,
      entries: categorizedEntries,
      persisted: shouldPersist,
      categorizedAt,
    });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/transparency/categorize', {
      origin: 'functions -> /api/transparency/categorize',
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(502).json({
      error: (err as Error)?.message || 'Falha ao categorizar transparência com Gemini.',
    });
  }
});

function extractGoogleSpreadsheetIdSafe(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  const match = rawUrl.trim().match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function foldSheetTabName(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function fetchGoogleSheetCsvsFromServer(
  spreadsheetUrl: string,
  monthSheet: string,
): Promise<{ overviewCsv?: string; monthCsv?: string }> {
  const spreadsheetId = extractGoogleSpreadsheetIdSafe(spreadsheetUrl);
  if (!spreadsheetId) return {};
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const htmlResp = await fetch(`${base}/htmlview`, { cache: 'no-store' });
  if (!htmlResp.ok) return {};
  const html = await htmlResp.text();
  const tabs: Array<{ name: string; gid: string }> = [];
  const regex = /items\.push\(\{name:\s*"([^"]+)"[^}]*gid:\s*"([0-9]+)"/g;
  let match = regex.exec(html);
  while (match) {
    tabs.push({ name: match[1], gid: match[2] });
    match = regex.exec(html);
  }
  const overviewTab = tabs.find((t) => foldSheetTabName(t.name) === 'overview');
  const targetTab = tabs.find((t) => foldSheetTabName(t.name) === foldSheetTabName(monthSheet));

  const [overviewCsv, monthCsv] = await Promise.all([
    overviewTab
      ? fetch(`${base}/export?format=csv&gid=${encodeURIComponent(overviewTab.gid)}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.text() : undefined))
          .catch(() => undefined)
      : Promise.resolve(undefined),
    targetTab
      ? fetch(`${base}/export?format=csv&gid=${encodeURIComponent(targetTab.gid)}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.text() : undefined))
          .catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  return { overviewCsv, monthCsv };
}

app.post('/api/transparency/audit-month', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL || !decoded.email_verified) {
    res.status(403).json({ error: 'Apenas camblufurb@gmail.com pode auditar a transparência.' });
    return;
  }

  const geminiAuth = getServerGeminiAuth();

  const body = (req.body || {}) as {
    monthSheet?: string;
    spreadsheetUrl?: string;
    overviewCsv?: string;
    monthCsv?: string;
    entries?: Array<{
      id?: string;
      sheet?: string;
      date?: string;
      type?: TransparencyEntryDirection;
      category?: string;
      description?: string;
      amountCents?: number;
    }>;
  };

  const monthSheet = sanitizeHeaderString(body.monthSheet || '', 60);
  if (!monthSheet) {
    res.status(400).json({ error: 'monthSheet obrigatório.' });
    return;
  }

  try {
    let entries: CategorizableTransparencyEntry[] = [];
    if (Array.isArray(body.entries)) {
      entries = body.entries
        .filter((e) => e && e.id && e.description && typeof e.amountCents === 'number')
        .slice(0, 300)
        .map((e) => ({
          id: sanitizeHeaderString(e.id, 120),
          sheet: sanitizeHeaderString(e.sheet || monthSheet, 60) || monthSheet,
          date: sanitizeHeaderString(e.date || '2026-01-01', 20),
          type:
            e.type === 'receita' || e.type === 'despesa' || e.type === 'ativo' || e.type === 'passivo'
              ? e.type
              : 'despesa',
          category: sanitizeHeaderString(e.category || '', 60),
          description: sanitizeHeaderString(e.description, 240),
          amountCents: Math.abs(Math.round(Number(e.amountCents) || 0)),
        }));
    } else {
      const snap = await db.collection('transparencyEntries').where('sheet', '==', monthSheet).get();
      entries = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          sheet: String(data.sheet || monthSheet),
          date: String(data.date || '2026-01-01'),
          type: (data.type as TransparencyEntryDirection) || 'despesa',
          category: String(data.category || ''),
          description: String(data.description || ''),
          amountCents: Math.abs(Number(data.amountCents) || 0),
        };
      });
    }

    let overviewCsv = typeof body.overviewCsv === 'string' ? body.overviewCsv.slice(0, 12_000) : undefined;
    let monthCsv = typeof body.monthCsv === 'string' ? body.monthCsv.slice(0, 20_000) : undefined;

    if ((!overviewCsv || !monthCsv) && body.spreadsheetUrl) {
      const fetched = await fetchGoogleSheetCsvsFromServer(body.spreadsheetUrl, monthSheet);
      overviewCsv = overviewCsv || fetched.overviewCsv;
      monthCsv = monthCsv || fetched.monthCsv;
    }

    const result = await runTransparencyMonthAudit(
      { monthSheet, entries, overviewCsv, monthCsv },
      geminiAuth,
    );

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/transparency/audit-month', {
      origin: 'functions -> /api/transparency/audit-month',
      monthSheet,
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(502).json({
      error: (err as Error)?.message || 'Falha ao conferir planilha e cálculos com Gemini.',
    });
  }
});

function isAllowedProductStorageUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 1500 &&
    trimmed.startsWith('https://firebasestorage.googleapis.com/v0/b/camblu.firebasestorage.app/')
  );
}

async function resolveInlineProductImages(
  productImages?: InlineImagePayload[],
  productImageUrls?: string[],
): Promise<InlineImagePayload[]> {
  const inlineProducts: InlineImagePayload[] = Array.isArray(productImages)
    ? productImages.slice(0, 4)
    : [];

  if (inlineProducts.length < 4 && Array.isArray(productImageUrls)) {
    const remainingSlots = 4 - inlineProducts.length;
    const safeUrls = productImageUrls.filter(isAllowedProductStorageUrl).slice(0, remainingSlots);
    for (const url of safeUrls) {
      const imgResp = await fetch(url);
      if (!imgResp.ok) continue;
      const ct = (imgResp.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase();
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(ct)) continue;
      const buf = Buffer.from(await imgResp.arrayBuffer());
      if (buf.length > 0 && buf.length <= 5_000_000) {
        inlineProducts.push({ mimeType: ct, data: buf.toString('base64') });
      }
    }
  }

  return inlineProducts;
}

app.post('/api/shop/generate-images', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL || !decoded.email_verified) {
    res.status(403).json({ error: 'Apenas camblufurb@gmail.com pode gerar imagens de produtos com IA.' });
    return;
  }

  const geminiAuth = getServerGeminiAuth();

  const body = (req.body || {}) as {
    productImages?: InlineImagePayload[];
    productImageUrls?: string[];
    shots?: ProductAiShotRequest[];
  };

  if (!Array.isArray(body.shots) || body.shots.length === 0 || body.shots.length > 4) {
    res.status(400).json({ error: 'Solicite entre 1 e 4 variações de imagem por geração.' });
    return;
  }

  try {
    const inlineProducts = await resolveInlineProductImages(body.productImages, body.productImageUrls);

    if (inlineProducts.length === 0) {
      res.status(400).json({ error: 'Envie ao menos uma imagem base válida do produto.' });
      return;
    }

    const result = await generateProductImagesWithNanoBanana({
      productImages: inlineProducts,
      shots: body.shots.slice(0, 4),
      apiKey: geminiAuth,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/shop/generate-images', {
      origin: 'functions -> /api/shop/generate-images',
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(502).json({
      error: (err as Error)?.message || 'Falha ao gerar imagens do produto com Gemini Nano Banana 2.1.',
    });
  }
});

app.post('/api/shop/generate-description', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL || !decoded.email_verified) {
    res.status(403).json({ error: 'Apenas camblufurb@gmail.com pode gerar descrições com IA.' });
    return;
  }

  const geminiAuth = getServerGeminiAuth();
  const body = (req.body || {}) as {
    name?: string;
    category?: string;
    sizes?: Array<{ size: string; stock?: number }>;
    details?: string[];
    currentDescription?: string;
    productImages?: InlineImagePayload[];
    productImageUrls?: string[];
  };

  if (!body.name?.trim()) {
    res.status(400).json({ error: 'Informe o nome do produto para gerar a descrição.' });
    return;
  }

  try {
    const inlineProducts = await resolveInlineProductImages(body.productImages, body.productImageUrls);
    const result = await generateProductDescriptionWithFlashLite({
      name: body.name,
      category: body.category,
      sizes: body.sizes,
      details: body.details,
      currentDescription: body.currentDescription,
      productImages: inlineProducts,
      apiKey: geminiAuth,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/shop/generate-description', {
      origin: 'functions -> /api/shop/generate-description',
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(502).json({
      error: (err as Error)?.message || 'Falha ao gerar descrição com gemini-flash-lite-latest.',
    });
  }
});

app.get('/sitemap.xml', async (req, res) => {
  const siteOrigin = resolveSiteOrigin(req);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [eventsSnap, productsSnap] = await Promise.all([
      db.collection('events').where('published', '==', true).get(),
      db.collection('products').where('active', '==', true).get(),
    ]);

    const urls: Array<{ loc: string; changefreq: string; priority: string; lastmod?: string }> =
      PUBLIC_ROUTE_SEO_LIST.filter((entry) => entry.indexable).map((entry) => ({
        loc: entry.path === '/' ? `${siteOrigin}/` : `${siteOrigin}${entry.path}`,
        changefreq: entry.changefreq,
        priority: entry.priority,
        lastmod: today,
      }));

    eventsSnap.docs.forEach((docSnap) => {
      const d = docSnap.data();
      const slug = String(d.slug || docSnap.id).trim();
      if (!slug) return;
      urls.push({
        loc: `${siteOrigin}/eventos/${encodeURIComponent(slug)}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: typeof d.updatedAt === 'string' ? d.updatedAt.slice(0, 10) : today,
      });
    });

    productsSnap.docs.forEach((docSnap) => {
      const d = docSnap.data();
      const slug = String(d.slug || docSnap.id).trim();
      if (!slug) return;
      urls.push({
        loc: `${siteOrigin}/lojinha/${encodeURIComponent(slug)}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: typeof d.updatedAt === 'string' ? d.updatedAt.slice(0, 10) : today,
      });
    });

    const xmlBody = urls
      .map(
        (u) =>
          `  <url><loc>${escapeHtml(u.loc)}</loc><lastmod>${escapeHtml(
            u.lastmod || today,
          )}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
      )
      .join('\n');

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=900');
    res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlBody}\n</urlset>`,
    );
  } catch (err) {
    console.error('[CAMBLU-API] Erro ao gerar /sitemap.xml', {
      origin: 'functions -> /sitemap.xml',
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(500).type('text/plain').send('Erro ao gerar sitemap.xml');
  }
});

// Item 4.2 — API aberta do Clube CAMBLU (retorna status não sensível e tierCode 0..4)
app.get('/api/clube/status', async (req, res) => {
  const rawCpf = typeof req.query.cpf === 'string' ? digitsOnly(req.query.cpf) : '';
  const rawEmail = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';

  if (!rawCpf && !rawEmail) {
    res.status(400).json({ error: 'Informe cpf ou email na query.' });
    return;
  }

  try {
    let snap;
    if (rawCpf) {
      snap = await db.collection('users').where('cpf', '==', rawCpf).limit(1).get();
    } else {
      snap = await db.collection('users').where('email', '==', rawEmail).limit(1).get();
    }

    res.set('Cache-Control', 'no-store');

    if (snap.empty) {
      res.json({ active: false, tier: 'none', tierCode: 0, validUntil: null });
      return;
    }

    const u = snap.docs[0].data();
    const validUntil = u.membershipValidUntil || null;
    const stillValid = Boolean(
      u.membershipActive && (!validUntil || new Date(validUntil).getTime() > Date.now()),
    );
    const activeTier = (stillValid ? u.membershipTier || 'none' : 'none') as MembershipTier;
    const tierCode = getMembershipTierCode(activeTier, stillValid);

    res.json({
      active: tierCode > 0,
      tier: tierCode > 0 ? activeTier : 'none',
      tierCode,
      validUntil,
    });
  } catch (err) {
    console.error('[CAMBLU-API] Erro ao consultar status do Clube', {
      origin: 'functions -> /api/clube/status',
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(500).json({ error: 'Não foi possível consultar o status da assinatura.' });
  }
});

// Validação pública de Carteirinha de Estudante via UID (QR Code)
app.get('/api/clube/cartao/verify', async (req, res) => {
  const uid = typeof req.query.uid === 'string' ? req.query.uid.trim() : '';
  if (!uid || uid.length > 128) {
    res.status(400).json({ valid: false, error: 'Informe o identificador da carteirinha.' });
    return;
  }

  try {
    const snap = await db.collection('users').doc(uid).get();
    res.set('Cache-Control', 'no-store');

    if (!snap.exists) {
      res.status(404).json({
        found: false,
        valid: false,
        active: false,
        tier: 'none',
        tierCode: 0,
        tierName: MEMBERSHIP_TIER_NAME_MAP.none,
        reason: 'Carteirinha de estudante não encontrada.',
        verifiedAt: new Date().toISOString(),
      });
      return;
    }

    const u = snap.data() || {};
    const validUntil = u.membershipValidUntil || null;
    const stillValid = Boolean(
      u.membershipActive && (!validUntil || new Date(validUntil).getTime() > Date.now()),
    );
    const rawTier = (u.membershipTier || 'none') as MembershipTier;
    const tierCode = getMembershipTierCode(rawTier, stillValid);
    const active = tierCode > 0;
    const activeTier: MembershipTier = active ? rawTier : 'none';
    const affiliation = u.affiliation === 'externo' ? 'externo' : 'FURB';
    const isFurbStudent = affiliation === 'FURB';
    const tierName = MEMBERSHIP_TIER_NAME_MAP[activeTier] || MEMBERSHIP_TIER_NAME_MAP.none;

    if (!active) {
      res.json({
        found: true,
        valid: false,
        active: false,
        tier: 'none',
        tierCode: 0,
        tierName: MEMBERSHIP_TIER_NAME_MAP.none,
        validUntil,
        uid,
        name: '',
        cpf: '',
        affiliation,
        institution: isFurbStudent ? 'FURB' : 'Externo (sem vínculo FURB)',
        course: isFurbStudent ? 'Medicina' : 'Visitante / Externo',
        turma: '',
        profileCompleted: Boolean(u.profileCompleted),
        reason:
          'Assinatura do Clube CAMBLU inativa ou expirada. A Carteirinha de Estudante é liberada a partir do Plano Comum.',
        verifiedAt: new Date().toISOString(),
      });
      return;
    }

    res.json({
      found: true,
      valid: isFurbStudent,
      active: true,
      tier: activeTier,
      tierCode,
      tierName,
      validUntil,
      uid,
      name: String(u.name || ''),
      cpf: digitsOnly(u.cpf || ''),
      photoURL: typeof u.photoURL === 'string' && u.photoURL.trim() ? u.photoURL.trim() : undefined,
      affiliation,
      institution: isFurbStudent ? 'FURB' : 'Externo (sem vínculo FURB)',
      course: isFurbStudent ? 'Medicina' : 'Visitante / Externo',
      turma: isFurbStudent && u.turma ? String(u.turma).trim() : '',
      enrollmentSummaryUrl: isFurbStudent ? isSafeEnrollmentPdfUrl(u.enrollmentSummaryUrl, uid) : undefined,
      profileCompleted: Boolean(u.profileCompleted),
      reason: isFurbStudent
        ? undefined
        : 'Cartão de membro externo ativo no Clube CAMBLU (não vinculado ao curso de Medicina FURB).',
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[CAMBLU-API] Erro ao validar carteirinha de estudante', {
      origin: 'functions -> /api/clube/cartao/verify',
      uid,
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    res.status(500).json({ valid: false, error: 'Erro ao validar autenticidade da carteirinha.' });
  }
});

// Verificação pública de certificado sem vazamento de CPF completo
app.get('/api/certificates/verify', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code.trim() : '';
  if (!code || code.length > 120) {
    res.status(400).json({ error: 'Informe o código do certificado.' });
    return;
  }

  try {
    const snap = await db.collection('certificates').where('code', '==', code).limit(1).get();
    res.set('Cache-Control', 'no-store');
    if (snap.empty) {
      res.status(404).json({ valid: false });
      return;
    }

    const c = snap.docs[0].data();
    const cpf = digitsOnly(c.ownerCpf || '');
    const maskedCpf = cpf.length === 11 ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '***';
    res.json({
      valid: true,
      code: c.code,
      ownerName: c.ownerName,
      maskedCpf,
      eventTitle: c.eventTitle,
      eventDateLabel: c.eventDateLabel,
      totalHours: c.totalHours,
      issuedAt: c.issuedAt,
    });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/certificates/verify', {
      origin: 'functions -> /api/certificates/verify',
      code,
      message: (err as Error)?.message,
    });
    res.status(500).json({ valid: false, error: 'Não foi possível verificar o certificado.' });
  }
});

app.post('/api/checkout/event', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Autenticação Google obrigatória.' });
    return;
  }

  const { eventId, lotId, paymentMethod } = req.body as {
    eventId?: string;
    lotId?: string;
    paymentMethod?: 'stripe_pix' | 'stripe_card';
  };
  if (!eventId || !lotId) {
    res.status(400).json({ error: 'eventId e lotId são obrigatórios.' });
    return;
  }

  try {
    const [evSnap, userSnap] = await Promise.all([
      db.collection('events').doc(eventId).get(),
      db.collection('users').doc(decoded.uid).get(),
    ]);

    if (!evSnap.exists || !userSnap.exists) {
      res.status(404).json({ error: 'Evento ou usuário não encontrado.' });
      return;
    }

    const evData = evSnap.data()!;
    if (evData.published === false) {
      res.status(400).json({ error: 'Este evento não está disponível para inscrições.' });
      return;
    }

    const userData = userSnap.data()!;
    const lots = (evData.lots || []) as Array<{
      id: string;
      name: string;
      priceCents: number;
      totalQuantity: number;
      soldQuantity: number;
      qrDefinitions: Array<{
        id: string;
        label: string;
        dateTime: string;
        certificateHours: number;
      }>;
    }>;
    const lot = lots.find((l) => l.id === lotId);
    if (!lot || lot.soldQuantity >= lot.totalQuantity) {
      res.status(400).json({ error: 'Lote indisponível ou esgotado.' });
      return;
    }

    const membershipValid = isMembershipCurrentlyValid(userData);
    const pricing = computeEventPricing(
      lot.priceCents,
      evData,
      (userData.membershipTier || 'none') as MembershipTier,
      membershipValid,
    );

    // Gratuidade pelo Clube (Raro nos eventos regulares, Épico/Lendário em todos incluindo SECIMED) — transação atômica e única por usuário
    if (pricing.finalCents === 0) {
      const existingTicketSnap = await db
        .collection('tickets')
        .where('ownerUid', '==', decoded.uid)
        .where('eventId', '==', evSnap.id)
        .limit(1)
        .get();
      if (!existingTicketSnap.empty) {
        res.status(409).json({ error: 'Você já possui um ingresso emitido para este evento.' });
        return;
      }

      const ticketId = `tkt-free-${evSnap.id.slice(0, 12)}-${decoded.uid.slice(0, 12)}`;
      const ticketRef = db.collection('tickets').doc(ticketId);

      await db.runTransaction(async (tx) => {
        const [freshEvSnap, freshTicketSnap] = await Promise.all([
          tx.get(evSnap.ref),
          tx.get(ticketRef),
        ]);
        if (freshTicketSnap.exists) {
          throw new Error('Você já possui um ingresso emitido para este evento.');
        }
        const freshEvData = freshEvSnap.data() || {};
        const freshLots = (freshEvData.lots || []) as typeof lots;
        const freshLot = freshLots.find((l) => l.id === lot.id);
        if (!freshLot || freshLot.soldQuantity >= freshLot.totalQuantity) {
          throw new Error('Lote indisponível ou esgotado.');
        }

        tx.set(ticketRef, {
          id: ticketId,
          eventId: evSnap.id,
          eventSlug: evData.slug,
          eventTitle: evData.title,
          lotId: freshLot.id,
          lotName: freshLot.name,
          ownerUid: decoded.uid,
          ownerName: userData.name || '',
          ownerCpf: userData.cpf || '',
          ownerEmail: userData.email || '',
          paidCents: 0,
          discountReason: pricing.reason || 'Gratuidade Clube CAMBLU',
          status: 'valid',
          purchasedAt: new Date().toISOString(),
          transferHistory: [],
          qrInstances: (freshLot.qrDefinitions || []).map((q, idx) => ({
            qrCode: `CAMBLU-${String(evData.slug).slice(0, 8).toUpperCase()}-${idx + 1}-${ticketId.slice(-5).toUpperCase()}`,
            definitionId: q.id,
            label: q.label,
            dateTime: q.dateTime,
            certificateHours: q.certificateHours,
            checkedInAt: null,
          })),
        });

        tx.update(evSnap.ref, {
          lots: freshLots.map((l) =>
            l.id === freshLot.id ? { ...l, soldQuantity: l.soldQuantity + 1 } : l,
          ),
        });
      });

      res.json({ freeIssued: true, ticketId });
      return;
    }

    const siteOrigin = resolveSiteOrigin(req);
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: paymentMethod === 'stripe_pix' ? ['pix', 'card'] : ['card', 'pix'],
      customer_email: userData.email || decoded.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: pricing.finalCents,
            product_data: {
              name: `${evData.title} — ${lot.name}`,
              description: pricing.reason || 'Ingresso CAMBLU (taxas Stripe inclusas)',
            },
          },
        },
      ],
      metadata: {
        kind: 'event_ticket',
        uid: decoded.uid,
        eventId: evSnap.id,
        lotId: lot.id,
        discountReason: pricing.reason || '',
      },
      success_url: `${siteOrigin}/meus-ingressos?checkout=success`,
      cancel_url: `${siteOrigin}/eventos/${evData.slug}?checkout=cancelled`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/checkout/event', {
      origin: 'functions -> /api/checkout/event',
      uid: decoded.uid,
      eventId,
      message: (err as Error)?.message,
    });
    res.status(400).json({ error: (err as Error)?.message || 'Falha ao iniciar checkout do evento.' });
  }
});

app.post('/api/checkout/shop', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Autenticação Google obrigatória.' });
    return;
  }

  const { items, paymentMethod } = req.body as {
    items?: Array<{ productId: string; size: string; quantity: number }>;
    paymentMethod?: 'stripe_pix' | 'stripe_card';
  };
  if (!Array.isArray(items) || items.length === 0 || items.length > 25) {
    res.status(400).json({ error: 'Sacola vazia ou acima do limite permitido.' });
    return;
  }

  try {
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    if (!userSnap.exists) {
      res.status(404).json({ error: 'Perfil do usuário não encontrado.' });
      return;
    }
    const userData = userSnap.data()!;

    let subtotalCents = 0;
    const resolvedItems: Array<{
      productId: string;
      productName: string;
      size: string;
      quantity: number;
      unitPriceCents: number;
    }> = [];

    for (const item of items) {
      if (
        !item?.productId ||
        !item?.size ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {
        res.status(400).json({ error: 'Quantidade ou item inválido na sacola.' });
        return;
      }

      const pSnap = await db.collection('products').doc(String(item.productId)).get();
      if (!pSnap.exists || pSnap.data()?.active === false) {
        res.status(400).json({ error: `Produto inválido: ${item.productId}` });
        return;
      }
      const pData = pSnap.data()!;
      const sizeObj = (pData.sizes || []).find(
        (s: { size: string; stock: number }) => s.size === item.size,
      );
      if (!sizeObj || sizeObj.stock < item.quantity) {
        res.status(400).json({ error: `Estoque insuficiente para ${pData.name} (${item.size}).` });
        return;
      }
      subtotalCents += pData.priceCents * item.quantity;
      resolvedItems.push({
        productId: pSnap.id,
        productName: pData.name,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: pData.priceCents,
      });
    }

    const membershipValid = isMembershipCurrentlyValid(userData);
    const pricing = computeShopPricing(
      subtotalCents,
      (userData.membershipTier || 'none') as MembershipTier,
      membershipValid,
    );

    const siteOrigin = resolveSiteOrigin(req);
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: paymentMethod === 'stripe_pix' ? ['pix', 'card'] : ['card', 'pix'],
      customer_email: userData.email || decoded.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: pricing.totalCents,
            product_data: {
              name: 'Pedido Lojinha CAMBLU',
              description: resolvedItems
                .map((i) => `${i.quantity}x ${i.productName} (${i.size})`)
                .join(', '),
            },
          },
        },
      ],
      metadata: {
        kind: 'shop_order',
        uid: decoded.uid,
        subtotalCents: String(subtotalCents),
        discountCents: String(pricing.discountCents),
        itemsJson: JSON.stringify(resolvedItems),
      },
      success_url: `${siteOrigin}/lojinha?checkout=success`,
      cancel_url: `${siteOrigin}/lojinha?checkout=cancelled`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/checkout/shop', {
      origin: 'functions -> /api/checkout/shop',
      uid: decoded.uid,
      message: (err as Error)?.message,
    });
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento da Lojinha.' });
  }
});

app.post('/api/checkout/membership', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Autenticação Google obrigatória.' });
    return;
  }

  const { tier, cycle } = req.body as {
    tier?: Exclude<MembershipTier, 'none'>;
    cycle?: MembershipCycle;
  };
  if (!tier || !cycle || !CLUB_PRICE_MAP[tier]?.[cycle]) {
    res.status(400).json({ error: 'Plano ou ciclo inválido.' });
    return;
  }

  try {
    const unitAmount = CLUB_PRICE_MAP[tier][cycle];
    const isMonthly = cycle === 'mensal';
    const siteOrigin = resolveSiteOrigin(req);
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: isMonthly ? 'subscription' : 'payment',
      payment_method_types: isMonthly ? ['card'] : ['card', 'pix'],
      customer_email: decoded.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: unitAmount,
            ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
            product_data: {
              name: `Clube CAMBLU — Plano ${tier.toUpperCase()} (${cycle})`,
            },
          },
        },
      ],
      metadata: {
        kind: 'club_membership',
        uid: decoded.uid,
        tier,
        cycle,
      },
      success_url: `${siteOrigin}/clube/cartao?assinatura=sucesso`,
      cancel_url: `${siteOrigin}/clube?assinatura=cancelada`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/checkout/membership', {
      origin: 'functions -> /api/checkout/membership',
      uid: decoded.uid,
      tier,
      cycle,
      message: (err as Error)?.message,
    });
    res.status(500).json({ error: 'Não foi possível iniciar a assinatura do Clube.' });
  }
});

app.post('/api/club/cancel', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Autenticação Google obrigatória.' });
    return;
  }

  try {
    const userRef = db.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      res.status(404).json({ error: 'Perfil do usuário não encontrado.' });
      return;
    }

    const userData = userSnap.data()!;
    const subId =
      typeof userData.stripeSubscriptionId === 'string'
        ? userData.stripeSubscriptionId.trim()
        : '';

    let stripeCanceled = false;
    if (subId) {
      try {
        const stripe = getStripeClient();
        const existingSub = await stripe.subscriptions.retrieve(subId);
        if (existingSub && existingSub.status !== 'canceled') {
          await stripe.subscriptions.cancel(subId);
          stripeCanceled = true;
        }
      } catch (stripeErr) {
        const code = (stripeErr as { code?: string })?.code;
        if (code !== 'resource_missing') {
          throw stripeErr;
        }
      }
    }

    const updatedAt = new Date().toISOString();
    await userRef.set(
      {
        membershipActive: false,
        membershipTier: 'none',
        membershipCycle: null,
        membershipValidUntil: null,
        stripeSubscriptionId: null,
        updatedAt,
      },
      { merge: true },
    );

    res.json({ ok: true, stripeCanceled, updatedAt });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/club/cancel', {
      origin: 'functions -> /api/club/cancel',
      uid: decoded.uid,
      message: (err as Error)?.message,
    });
    res.status(500).json({ error: 'Não foi possível cancelar a assinatura do Clube CAMBLU.' });
  }
});

// Item 1.5 — Transferência atômica de ingresso por CPF
app.post('/api/tickets/transfer', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Autenticação obrigatória.' });
    return;
  }

  const { ticketId, toCpf } = req.body as { ticketId?: string; toCpf?: string };
  const cleanCpf = digitsOnly(toCpf || '');
  if (!ticketId || cleanCpf.length !== 11) {
    res.status(400).json({ error: 'ticketId e CPF válido (11 dígitos) são obrigatórios.' });
    return;
  }

  try {
    const recipientSnap = await db.collection('users').where('cpf', '==', cleanCpf).limit(1).get();
    if (recipientSnap.empty) {
      res.status(404).json({ error: 'Nenhuma conta cadastrada encontrada com este CPF.' });
      return;
    }
    const dest = recipientSnap.docs[0].data();
    if (dest.uid === decoded.uid) {
      res.status(400).json({ error: 'O ingresso já pertence à sua conta.' });
      return;
    }

    const ticketRef = db.collection('tickets').doc(ticketId);
    let updatedTicket: Record<string, unknown> | null = null;

    await db.runTransaction(async (tx) => {
      const tSnap = await tx.get(ticketRef);
      if (!tSnap.exists) throw new Error('Ingresso não encontrado.');
      const tData = tSnap.data()!;
      if (tData.ownerUid !== decoded.uid) {
        throw new Error('Você não é o titular deste ingresso.');
      }
      const qrs = (tData.qrInstances || []) as Array<{ checkedInAt?: string | null }>;
      if (qrs.some((q) => Boolean(q.checkedInAt))) {
        throw new Error('Ingressos com presença já registrada não podem ser transferidos.');
      }

      const logEntry = {
        fromUid: tData.ownerUid,
        fromCpf: tData.ownerCpf,
        toUid: dest.uid,
        toCpf: dest.cpf,
        transferredAt: new Date().toISOString(),
      };
      const nextHistory = [...(tData.transferHistory || []), logEntry];
      tx.update(ticketRef, {
        ownerUid: dest.uid,
        ownerName: dest.name,
        ownerCpf: dest.cpf,
        ownerEmail: dest.email,
        transferHistory: nextHistory,
      });
      updatedTicket = {
        ...tData,
        ownerUid: dest.uid,
        ownerName: dest.name,
        ownerCpf: dest.cpf,
        ownerEmail: dest.email,
        transferHistory: nextHistory,
      };
    });

    res.json({ ok: true, ticket: updatedTicket });
  } catch (err) {
    console.warn('[CAMBLU-API] Falha ao transferir ingresso em /api/tickets/transfer', {
      origin: 'functions -> /api/tickets/transfer',
      uid: decoded.uid,
      ticketId,
      message: (err as Error)?.message,
    });
    res.status(400).json({ error: (err as Error)?.message || 'Falha ao transferir ingresso.' });
  }
});

// Item 1.4 — Check-in administrativo de QR Code e emissão automática de certificado
app.post('/api/tickets/checkin', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL || !decoded.email_verified) {
    res.status(403).json({ error: 'Apenas camblufurb@gmail.com pode validar ingressos.' });
    return;
  }

  const { qrCode } = req.body as { qrCode?: string };
  const cleanQr = typeof qrCode === 'string' ? qrCode.trim() : '';
  if (!cleanQr || cleanQr.length > 160) {
    res.status(400).json({ error: 'qrCode obrigatório.' });
    return;
  }

  try {
    const allSnap = await db.collection('tickets').get();
    const targetDoc = allSnap.docs.find((d) =>
      ((d.data().qrInstances || []) as Array<{ qrCode: string }>).some((q) => q.qrCode === cleanQr),
    );
    if (!targetDoc) {
      res.status(404).json({ error: 'QR Code não encontrado.' });
      return;
    }

    const tData = targetDoc.data();
    const existingQrs = (tData.qrInstances || []) as Array<{
      qrCode: string;
      certificateHours: number;
      checkedInAt?: string | null;
      checkedInBy?: string | null;
    }>;
    const targetQrInstance = existingQrs.find((q) => q.qrCode === cleanQr);
    if (targetQrInstance?.checkedInAt) {
      res.status(409).json({
        error: `Este QR Code já teve presença registrada para ${tData.ownerName || 'o participante'}.`,
      });
      return;
    }

    const now = new Date().toISOString();
    const nextQrs = existingQrs.map((q) =>
      q.qrCode === cleanQr && !q.checkedInAt
        ? { ...q, checkedInAt: now, checkedInBy: ADMIN_EMAIL }
        : q,
    );
    await targetDoc.ref.update({ qrInstances: nextQrs });

    const totalHours = nextQrs
      .filter((q) => Boolean(q.checkedInAt))
      .reduce((acc, q) => acc + (q.certificateHours || 0), 0);

    const certId = `cert-${targetDoc.id}`;
    const evSnap = await db.collection('events').doc(tData.eventId).get();
    const evData = evSnap.data() || {};

    await db.collection('certificates').doc(certId).set(
      {
        id: certId,
        code: `CAMBLU-${new Date().getFullYear()}-${targetDoc.id.slice(-5).toUpperCase()}`,
        ticketId: targetDoc.id,
        eventId: tData.eventId,
        eventTitle: tData.eventTitle,
        eventDateLabel: evData.startAt ? new Date(evData.startAt).toLocaleDateString('pt-BR') : 'Blumenau/SC',
        ownerUid: tData.ownerUid,
        ownerName: tData.ownerName,
        ownerCpf: tData.ownerCpf,
        totalHours,
        issuedAt: now,
        templateConfig: evData.certificateTemplate || null,
      },
      { merge: true },
    );

    res.json({ ok: true, totalHours, ownerName: tData.ownerName });
  } catch (err) {
    console.error('[CAMBLU-API] Erro em /api/tickets/checkin', {
      origin: 'functions -> /api/tickets/checkin',
      message: (err as Error)?.message,
    });
    res.status(500).json({ error: 'Falha ao registrar presença.' });
  }
});

// Item 8 — Envio de Demandas & CAMBLU Mulher para camblufurb@gmail.com
app.post('/api/demands/send', async (req, res) => {
  const { topic, anonymous, senderName, senderEmail, turma, message } = req.body as {
    topic?: string;
    anonymous?: boolean;
    senderName?: string;
    senderEmail?: string;
    turma?: string;
    message?: string;
  };

  const validTopics = ['Demanda de turma', 'Demanda pessoal', 'Dúvida', 'Reclamação', 'CAMBLU Mulher'];
  if (!topic || !validTopics.includes(topic) || !message || message.trim().length < 5) {
    res.status(400).json({ error: 'Tópico ou mensagem inválidos.' });
    return;
  }

  const cleanSenderName = anonymous ? null : sanitizeHeaderString(senderName, 140) || null;
  const cleanSenderEmail = anonymous ? null : sanitizeHeaderString(senderEmail, 160) || null;
  const cleanTurma = sanitizeHeaderString(turma, 16) || null;
  const id = `dem-${Date.now().toString(36)}`;
  let dispatchedEmail = false;

  try {
    const pass = smtpPass.value();
    if (pass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: ADMIN_EMAIL, pass },
      });
      await transporter.sendMail({
        from: `"Portal CAMBLU" <${ADMIN_EMAIL}>`,
        to: ADMIN_EMAIL,
        replyTo: cleanSenderEmail || undefined,
        subject: topic,
        text: [
          `Tópico: ${topic}`,
          `Anônimo: ${anonymous ? 'Sim' : 'Não'}`,
          cleanSenderName ? `Nome: ${cleanSenderName}` : null,
          cleanSenderEmail ? `E-mail: ${cleanSenderEmail}` : null,
          cleanTurma ? `Turma: ${cleanTurma}` : null,
          '',
          message.trim().slice(0, 4000),
        ]
          .filter(Boolean)
          .join('\n'),
      });
      dispatchedEmail = true;
    }
  } catch (err) {
    console.error('[CAMBLU-API] Erro SMTP em /api/demands/send', {
      origin: 'functions -> /api/demands/send -> nodemailer.sendMail',
      message: (err as Error)?.message,
      code: (err as { code?: string })?.code,
      stack: (err as Error)?.stack,
    });
    dispatchedEmail = false;
  }

  try {
    await db.collection('demands').doc(id).set({
      id,
      topic,
      anonymous: Boolean(anonymous),
      senderName: cleanSenderName,
      senderEmail: cleanSenderEmail,
      turma: cleanTurma,
      message: message.trim().slice(0, 4000),
      dispatchedEmail,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.json({ ok: true, id, dispatchedEmail });
  } catch (err) {
    console.error('[CAMBLU-API] Erro ao salvar demanda no Firestore', {
      origin: 'functions -> /api/demands/send -> db.demands',
      message: (err as Error)?.message,
    });
    res.status(500).json({ error: 'Não foi possível registrar a demanda.' });
  }
});

export const api = onRequest(
  {
    region: 'southamerica-east1',
    timeoutSeconds: 180,
    secrets: [stripeRestrictedKey, stripeWebhookSecret, smtpPass, geminiApiKey],
  },
  app,
);

const INDEX_HTML_CACHE_TTL_MS = 60_000;
const indexHtmlCache = new Map<string, { html: string; fetchedAt: number }>();

async function getCachedIndexHtml(siteOrigin: string): Promise<string> {
  const cached = indexHtmlCache.get(siteOrigin);
  if (cached && Date.now() - cached.fetchedAt < INDEX_HTML_CACHE_TTL_MS && cached.html) {
    return cached.html;
  }
  try {
    const upstream = await fetch(`${siteOrigin}/index.html`);
    if (upstream.ok) {
      const html = await upstream.text();
      if (html) {
        indexHtmlCache.set(siteOrigin, { html, fetchedAt: Date.now() });
        return html;
      }
    }
  } catch (err) {
    console.warn('[CAMBLU-API] Falha ao buscar index.html para OpenGraph/SEO', {
      origin: 'functions -> handleSocialPreviewRequest -> fetch',
      siteOrigin,
      message: (err as Error)?.message,
    });
  }
  return cached?.html || '';
}

async function resolveDynamicSocialMeta(path: string, siteOrigin: string): Promise<SeoMetaPayload> {
  const normalizedPath = normalizePathname(path);

  const eventMatch = normalizedPath.match(/^\/eventos\/([^/]+)$/);
  if (eventMatch?.[1]) {
    const rawSlug = decodeURIComponent(eventMatch[1]).trim();
    if (rawSlug) {
      let snap = await db.collection('events').where('slug', '==', rawSlug).limit(1).get();
      let evData = snap.empty ? null : snap.docs[0].data();
      if (!evData) {
        const docSnap = await db.collection('events').doc(rawSlug).get();
        if (docSnap.exists) evData = docSnap.data() || null;
      }
      if (evData) {
        return buildEventSeoMeta(evData, rawSlug, siteOrigin);
      }
    }
    return {
      ...resolveStaticRouteSeo('/eventos', siteOrigin),
      canonicalUrl: `${siteOrigin}${normalizedPath}`,
    };
  }

  const productMatch = normalizedPath.match(/^\/lojinha\/([^/]+)$/);
  if (productMatch?.[1]) {
    const rawSlug = decodeURIComponent(productMatch[1]).trim();
    if (rawSlug) {
      const snap = await db.collection('products').where('slug', '==', rawSlug).limit(1).get();
      let productData = snap.empty ? null : snap.docs[0].data();
      if (!productData) {
        const docSnap = await db.collection('products').doc(rawSlug).get();
        if (docSnap.exists) productData = docSnap.data() || null;
      }
      if (productData) {
        return buildProductSeoMeta(productData, rawSlug, siteOrigin);
      }
    }
    return {
      ...resolveStaticRouteSeo('/lojinha', siteOrigin),
      canonicalUrl: `${siteOrigin}${normalizedPath}`,
    };
  }

  return resolveStaticRouteSeo(normalizedPath, siteOrigin);
}

async function handleSocialPreviewRequest(
  req: { path: string; headers: Record<string, string | string[] | undefined> },
  res: {
    set(field: string, value: string): unknown;
    status(code: number): { send(body: string): unknown };
  },
) {
  const siteOrigin = resolveSiteOrigin(req);
  const targetPath = normalizePathname(req.path || '/');
  let meta = resolveStaticRouteSeo(targetPath, siteOrigin);

  try {
    meta = await resolveDynamicSocialMeta(targetPath, siteOrigin);
  } catch (err) {
    console.warn('[CAMBLU-API] Falha ao resolver metadados dinâmicos SEO/OG; usando estáticos', {
      origin: 'functions -> handleSocialPreviewRequest',
      path: targetPath,
      message: (err as Error)?.message,
    });
  }

  const indexHtml = await getCachedIndexHtml(siteOrigin);
  const renderedHtml = injectSeoIntoHtml(indexHtml, meta);
  const cacheControl = meta.robots.startsWith('noindex')
    ? 'private, no-store'
    : 'public, max-age=120, s-maxage=300';

  res.set('Cache-Control', cacheControl);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(renderedHtml);
}

// Item 1.1 — Social Preview e SEO dinâmico para links compartilhados e indexação
export const eventSocialPreview = onRequest({ region: 'southamerica-east1' }, handleSocialPreviewRequest);
export const socialPreview = onRequest({ region: 'southamerica-east1' }, handleSocialPreviewRequest);
