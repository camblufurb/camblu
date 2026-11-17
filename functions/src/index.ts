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
  type MembershipCycle,
  type MembershipTier,
} from './pricing.js';

initializeApp();
const db = getFirestore();
const authAdmin = getAuth();

const ADMIN_EMAIL = 'camblufurb@gmail.com';
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://camblu.org';

const stripeRestrictedKey = defineSecret('STRIPE_RESTRICTED_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const smtpPass = defineSecret('SMTP_PASS');

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

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function verifyBearerToken(req: Request): Promise<DecodedIdToken | null> {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    return await authAdmin.verifyIdToken(token);
  } catch {
    return null;
  }
}

const app = express();
app.use(cors({ origin: true }));

// Stripe Webhook MUST receive unparsed rawBody before express.json()
app.post('/api/stripe/webhook', async (req: Request & { rawBody?: Buffer }, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !req.rawBody) {
    res.status(400).send('Missing Stripe signature or raw body');
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value());
  } catch (err) {
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

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'camblu-api' });
});

// Item 4.2 — API aberta do Clube CAMBLU (retorna apenas status não sensível)
app.get('/api/clube/status', async (req, res) => {
  const rawCpf = typeof req.query.cpf === 'string' ? digitsOnly(req.query.cpf) : '';
  const rawEmail = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';

  if (!rawCpf && !rawEmail) {
    res.status(400).json({ error: 'Informe cpf ou email na query.' });
    return;
  }

  let snap;
  if (rawCpf) {
    snap = await db.collection('users').where('cpf', '==', rawCpf).limit(1).get();
  } else {
    snap = await db.collection('users').where('email', '==', rawEmail).limit(1).get();
  }

  if (snap.empty) {
    res.json({ active: false, tier: 'none', validUntil: null });
    return;
  }

  const u = snap.docs[0].data();
  const validUntil = u.membershipValidUntil || null;
  const stillValid = Boolean(
    u.membershipActive && (!validUntil || new Date(validUntil).getTime() > Date.now()),
  );

  res.json({
    active: stillValid,
    tier: stillValid ? u.membershipTier || 'none' : 'none',
    validUntil,
  });
});

// Verificação pública de certificado sem vazamento de CPF completo
app.get('/api/certificates/verify', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code.trim() : '';
  if (!code) {
    res.status(400).json({ error: 'Informe o código do certificado.' });
    return;
  }

  const snap = await db.collection('certificates').where('code', '==', code).limit(1).get();
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

  const [evSnap, userSnap] = await Promise.all([
    db.collection('events').doc(eventId).get(),
    db.collection('users').doc(decoded.uid).get(),
  ]);

  if (!evSnap.exists || !userSnap.exists) {
    res.status(404).json({ error: 'Evento ou usuário não encontrado.' });
    return;
  }

  const evData = evSnap.data()!;
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

  const pricing = computeEventPricing(
    lot.priceCents,
    evData,
    (userData.membershipTier || 'none') as MembershipTier,
    Boolean(userData.membershipActive),
  );

  // Gratuidade pelo Clube (Raro em Coffee, Épico/Lendário em todos)
  if (pricing.finalCents === 0) {
    const ticketId = `tkt-${Date.now().toString(36)}-${decoded.uid.slice(0, 5)}`;
    await db.collection('tickets').doc(ticketId).set({
      id: ticketId,
      eventId: evSnap.id,
      eventSlug: evData.slug,
      eventTitle: evData.title,
      lotId: lot.id,
      lotName: lot.name,
      ownerUid: decoded.uid,
      ownerName: userData.name || '',
      ownerCpf: userData.cpf || '',
      ownerEmail: userData.email || '',
      paidCents: 0,
      discountReason: pricing.reason || 'Gratuidade Clube CAMBLU',
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
    await evSnap.ref.update({
      lots: lots.map((l) => (l.id === lot.id ? { ...l, soldQuantity: l.soldQuantity + 1 } : l)),
    });
    res.json({ freeIssued: true, ticketId });
    return;
  }

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
    success_url: `${SITE_ORIGIN}/meus-ingressos?checkout=success`,
    cancel_url: `${SITE_ORIGIN}/eventos/${evData.slug}?checkout=cancelled`,
  });

  res.json({ checkoutUrl: session.url });
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
  if (!items || items.length === 0) {
    res.status(400).json({ error: 'Sacola vazia.' });
    return;
  }

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
    const pSnap = await db.collection('products').doc(item.productId).get();
    if (!pSnap.exists) {
      res.status(400).json({ error: `Produto inválido: ${item.productId}` });
      return;
    }
    const pData = pSnap.data()!;
    const sizeObj = (pData.sizes || []).find((s: { size: string; stock: number }) => s.size === item.size);
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

  const pricing = computeShopPricing(
    subtotalCents,
    (userData.membershipTier || 'none') as MembershipTier,
    Boolean(userData.membershipActive),
  );

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
            description: resolvedItems.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', '),
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
    success_url: `${SITE_ORIGIN}/lojinha?checkout=success`,
    cancel_url: `${SITE_ORIGIN}/lojinha?checkout=cancelled`,
  });

  res.json({ checkoutUrl: session.url });
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

  const unitAmount = CLUB_PRICE_MAP[tier][cycle];
  const isMonthly = cycle === 'mensal';
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
    success_url: `${SITE_ORIGIN}/clube/cartao?assinatura=sucesso`,
    cancel_url: `${SITE_ORIGIN}/clube?assinatura=cancelada`,
  });

  res.json({ checkoutUrl: session.url });
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

  const recipientSnap = await db.collection('users').where('cpf', '==', cleanCpf).limit(1).get();
  if (recipientSnap.empty) {
    res.status(404).json({ error: 'Nenhuma conta cadastrada encontrada com este CPF.' });
    return;
  }
  const dest = recipientSnap.docs[0].data();
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
});

// Item 1.4 — Check-in administrativo de QR Code e emissão automática de certificado
app.post('/api/tickets/checkin', async (req, res) => {
  const decoded = await verifyBearerToken(req);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL || !decoded.email_verified) {
    res.status(403).json({ error: 'Apenas camblufurb@gmail.com pode validar ingressos.' });
    return;
  }

  const { qrCode } = req.body as { qrCode?: string };
  if (!qrCode) {
    res.status(400).json({ error: 'qrCode obrigatório.' });
    return;
  }

  const allSnap = await db.collection('tickets').get();
  const targetDoc = allSnap.docs.find((d) =>
    ((d.data().qrInstances || []) as Array<{ qrCode: string }>).some((q) => q.qrCode === qrCode.trim()),
  );
  if (!targetDoc) {
    res.status(404).json({ error: 'QR Code não encontrado.' });
    return;
  }

  const tData = targetDoc.data();
  const now = new Date().toISOString();
  const nextQrs = (tData.qrInstances as Array<{
    qrCode: string;
    certificateHours: number;
    checkedInAt?: string | null;
    checkedInBy?: string | null;
  }>).map((q) =>
    q.qrCode === qrCode.trim() && !q.checkedInAt
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
        replyTo: !anonymous && senderEmail ? senderEmail : undefined,
        subject: topic,
        text: [
          `Tópico: ${topic}`,
          `Anônimo: ${anonymous ? 'Sim' : 'Não'}`,
          !anonymous && senderName ? `Nome: ${senderName}` : null,
          !anonymous && senderEmail ? `E-mail: ${senderEmail}` : null,
          turma ? `Turma: ${turma}` : null,
          '',
          message.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
      });
      dispatchedEmail = true;
    }
  } catch {
    dispatchedEmail = false;
  }

  await db.collection('demands').doc(id).set({
    id,
    topic,
    anonymous: Boolean(anonymous),
    senderName: anonymous ? null : senderName || null,
    senderEmail: anonymous ? null : senderEmail || null,
    turma: turma || null,
    message: message.trim().slice(0, 4000),
    dispatchedEmail,
    createdAt: FieldValue.serverTimestamp(),
  });

  res.json({ ok: true, id, dispatchedEmail });
});

export const api = onRequest(
  {
    region: 'southamerica-east1',
    secrets: [stripeRestrictedKey, stripeWebhookSecret, smtpPass],
  },
  app,
);

// Item 1.1 — Social Preview dinâmico (OpenGraph) para links compartilhados /eventos/:slug
export const eventSocialPreview = onRequest({ region: 'southamerica-east1' }, async (req, res) => {
  const slug = req.path.replace(/^\/eventos\//, '').replace(/\/$/, '');
  let title = 'CAMBLU — Eventos Medicina FURB';
  let description =
    'Confira programação, lotes, ingressos e certificação oficial no portal do CAMBLU.';
  let image = `${SITE_ORIGIN}/logo-camblu.png`;

  if (slug) {
    const snap = await db.collection('events').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) {
      const ev = snap.docs[0].data();
      title = `${ev.title} | CAMBLU Eventos`;
      description = String(ev.description || description).slice(0, 220);
      if (ev.imageUrl) image = String(ev.imageUrl);
    }
  }

  let indexHtml = '';
  try {
    const upstream = await fetch(`${SITE_ORIGIN}/index.html`);
    if (upstream.ok) indexHtml = await upstream.text();
  } catch {
    indexHtml = '';
  }

  const ogTags = `
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(`${SITE_ORIGIN}/eventos/${slug}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `;

  if (indexHtml) {
    const injected = indexHtml.replace(/<title>.*?<\/title>/is, ogTags);
    res.set('Cache-Control', 'public, max-age=120, s-maxage=300');
    res.status(200).send(injected);
    return;
  }

  res.status(200).send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${ogTags}</head><body><script>location.replace('/eventos/${escapeHtml(slug)}');</script></body></html>`);
});
