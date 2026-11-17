import { describe, expect, it } from 'vitest';
import { computeClubStats, computeEventStats, computeShopStats } from '../adminStats';
import type { CambluEvent, CertificateRecord, ShopOrder, ShopProduct, Ticket, UserProfile } from '../../types/domain';

describe('adminStats helpers', () => {
  it('computes shop revenue, donations, low stock alerts and product ranking cleanly', () => {
    const products: ShopProduct[] = [
      {
        id: 'p1',
        name: 'Moletom MEDFURB',
        description: 'Moletom',
        priceCents: 16900,
        images: [],
        category: 'Vestuário',
        active: true,
        sizes: [
          { size: 'P', stock: 2 },
          { size: 'M', stock: 12 },
        ],
      },
      {
        id: 'p2',
        name: 'Tirante',
        description: 'Tirante',
        priceCents: 2400,
        images: [],
        category: 'Acessórios',
        active: true,
        sizes: [{ size: 'Único', stock: 0 }],
      },
    ];

    const orders: ShopOrder[] = [
      {
        id: 'o1',
        buyerUid: 'u1',
        buyerName: 'Ana',
        buyerEmail: 'ana@furb.br',
        buyerPhone: '47999999999',
        items: [{ productId: 'p1', productName: 'Moletom MEDFURB', size: 'M', quantity: 2, unitPriceCents: 16900 }],
        subtotalCents: 33800,
        discountCents: 3380,
        totalCents: 30420,
        paymentMethod: 'stripe_pix',
        paymentStatus: 'paid',
        delivered: false,
        createdAt: '2026-11-10T10:00:00.000Z',
      },
      {
        id: 'o2',
        buyerUid: 'manual',
        buyerName: 'Calouro',
        buyerEmail: 'calouro@furb.br',
        buyerPhone: '',
        items: [{ productId: 'p2', productName: 'Tirante', size: 'Único', quantity: 3, unitPriceCents: 0 }],
        subtotalCents: 0,
        discountCents: 0,
        totalCents: 0,
        paymentMethod: 'doacao',
        paymentStatus: 'donation',
        delivered: true,
        createdAt: '2026-11-11T10:00:00.000Z',
      },
    ];

    const stats = computeShopStats(products, orders);
    expect(stats.totalOrders).toBe(2);
    expect(stats.paidOrdersCount).toBe(1);
    expect(stats.donationsCount).toBe(1);
    expect(stats.pendingDeliveries).toBe(1);
    expect(stats.deliveredOrders).toBe(1);
    expect(stats.netRevenueCents).toBe(30420);
    expect(stats.discountsGrantedCents).toBe(3380);
    expect(stats.unitsSold).toBe(2);
    expect(stats.donatedUnits).toBe(3);
    expect(stats.totalStockUnits).toBe(14);
    expect(stats.outOfStockCount).toBe(1);
    expect(stats.lowStockVariants.map((v) => `${v.productId}:${v.size}`)).toEqual(['p2:Único', 'p1:P']);
    expect(stats.topProducts[0]?.productId).toBe('p1');
  });

  it('computes club MRR, tier breakdown and subscription expiration filtering', () => {
    const now = new Date('2026-11-17T12:00:00.000Z').getTime();
    const members: UserProfile[] = [
      {
        uid: 'u1',
        name: 'Marina',
        email: 'm@furb.br',
        cpf: '11111111111',
        phone: '47999999999',
        affiliation: 'FURB',
        turma: '63',
        isCalouro: true,
        membershipTier: 'raro',
        membershipCycle: 'semestral',
        membershipActive: true,
        membershipValidUntil: '2027-03-01T00:00:00.000Z',
        role: 'student',
        profileCompleted: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      {
        uid: 'u2',
        name: 'Lucas',
        email: 'l@furb.br',
        cpf: '22222222222',
        phone: '47999999998',
        affiliation: 'FURB',
        turma: '61',
        isCalouro: false,
        membershipTier: 'lendario',
        membershipCycle: 'mensal',
        membershipActive: true,
        membershipValidUntil: '2026-12-30T00:00:00.000Z',
        role: 'student',
        profileCompleted: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      {
        uid: 'u3',
        name: 'Expirado',
        email: 'e@furb.br',
        cpf: '33333333333',
        phone: '47999999997',
        affiliation: 'externo',
        isCalouro: false,
        membershipTier: 'comum',
        membershipCycle: 'mensal',
        membershipActive: true,
        membershipValidUntil: '2026-10-01T00:00:00.000Z',
        role: 'student',
        profileCompleted: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const stats = computeClubStats(members, [], [], now);
    expect(stats.totalRegisteredUsers).toBe(3);
    expect(stats.activeSubscribers).toBe(2);
    expect(stats.inactiveOrNonMembers).toBe(1);
    expect(stats.conversionRatePercent).toBe(67);
    expect(stats.calourosCount).toBe(1);
    // Raro semestral = 4000 / 6 = 667 + Lendario mensal 5000 = 5667
    expect(stats.mrrCents).toBe(5667);
    expect(stats.tierBreakdown.find((t) => t.tier === 'raro')?.semesterCount).toBe(1);
    expect(stats.tierBreakdown.find((t) => t.tier === 'lendario')?.monthlyCount).toBe(1);
  });

  it('computes single event metrics for lots, check-ins and certificates', () => {
    const event: CambluEvent = {
      id: 'ev1',
      slug: 'ev-1',
      title: 'Simpósio',
      description: 'Desc',
      imageUrl: '',
      maxCapacity: 100,
      mode: 'presencial',
      locationShort: 'FURB',
      category: 'academico',
      isSecimed: false,
      hasCoffee: false,
      startAt: '2026-11-28T08:30:00-03:00',
      endAt: '2026-11-28T12:30:00-03:00',
      published: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      lots: [
        {
          id: 'l1',
          name: 'Lote 1',
          priceCents: 2500,
          totalQuantity: 100,
          soldQuantity: 40,
          qrCodesPerTicket: 2,
          active: true,
          qrDefinitions: [],
        },
      ],
    };
    const tickets: Ticket[] = [
      {
        id: 't1',
        eventId: 'ev1',
        eventSlug: 'ev-1',
        eventTitle: 'Simpósio',
        lotId: 'l1',
        lotName: 'Lote 1',
        ownerUid: 'u1',
        ownerName: 'Marina',
        ownerCpf: '111',
        ownerEmail: 'm@f.br',
        paidCents: 2500,
        status: 'valid',
        purchasedAt: '2026-11-01T00:00:00.000Z',
        transferHistory: [],
        qrInstances: [
          { qrCode: 'QR1', definitionId: 'd1', label: 'Manhã', dateTime: '2026-11-28', certificateHours: 4, checkedInAt: '2026-11-28' },
          { qrCode: 'QR2', definitionId: 'd2', label: 'Tarde', dateTime: '2026-11-28', certificateHours: 4, checkedInAt: null },
        ],
      },
    ];
    const certs: CertificateRecord[] = [
      {
        id: 'c1',
        code: 'CERT1',
        ticketId: 't1',
        eventId: 'ev1',
        eventTitle: 'Simpósio',
        eventDateLabel: '28/11',
        ownerUid: 'u1',
        ownerName: 'Marina',
        ownerCpf: '111',
        totalHours: 4,
        issuedAt: '2026-11-28',
      },
    ];

    const stats = computeEventStats(event, tickets, certs);
    expect(stats.soldCount).toBe(40);
    expect(stats.remainingCount).toBe(60);
    expect(stats.occupancyPercent).toBe(40);
    expect(stats.totalQrSlots).toBe(2);
    expect(stats.checkedInQrCount).toBe(1);
    expect(stats.uniqueAttendeesCheckedIn).toBe(1);
    expect(stats.certificatesIssuedCount).toBe(1);
    expect(stats.totalCertifiedHours).toBe(4);
  });
});
