import { CLUB_PLANS, getPlanPriceCents } from './clubPricing';
import type {
  CambluEvent,
  CertificateRecord,
  MembershipTier,
  ShopOrder,
  ShopProduct,
  Ticket,
  UserProfile,
} from '../types/domain';

export interface LowStockVariant {
  productId: string;
  productName: string;
  size: string;
  stock: number;
  active: boolean;
}

export interface ProductSalesRank {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueCents: number;
}

export interface PaymentBreakdownRow {
  method: ShopOrder['paymentMethod'];
  label: string;
  ordersCount: number;
  revenueCents: number;
}

export interface ShopStats {
  totalOrders: number;
  paidOrdersCount: number;
  donationsCount: number;
  pendingDeliveries: number;
  deliveredOrders: number;
  grossRevenueCents: number;
  netRevenueCents: number;
  discountsGrantedCents: number;
  averageTicketCents: number;
  unitsSold: number;
  donatedUnits: number;
  activeProductsCount: number;
  totalStockUnits: number;
  lowStockVariants: LowStockVariant[];
  outOfStockCount: number;
  topProducts: ProductSalesRank[];
  paymentBreakdown: PaymentBreakdownRow[];
}

export interface ClubTierBreakdown {
  tier: Exclude<MembershipTier, 'none'>;
  name: string;
  themeColor: string;
  accentColor: string;
  membersCount: number;
  monthlyCount: number;
  semesterCount: number;
  mrrCents: number;
}

export interface ClubStats {
  totalRegisteredUsers: number;
  activeSubscribers: number;
  inactiveOrNonMembers: number;
  conversionRatePercent: number;
  calourosCount: number;
  mrrCents: number;
  projectedAnnualCents: number;
  totalDiscountsSavedCents: number;
  tierBreakdown: ClubTierBreakdown[];
}

export interface EventStats {
  totalCapacity: number;
  totalLotQuantity: number;
  soldCount: number;
  remainingCount: number;
  occupancyPercent: number;
  grossRevenueCents: number;
  issuedTicketsCount: number;
  totalQrSlots: number;
  checkedInQrCount: number;
  uniqueAttendeesCheckedIn: number;
  certificatesIssuedCount: number;
  totalCertifiedHours: number;
}

export const PAYMENT_METHOD_LABELS: Record<ShopOrder['paymentMethod'], string> = {
  stripe_pix: 'PIX Online',
  stripe_card: 'Cartão de Crédito',
  externo_pix: 'Venda Presencial (PIX/Dinheiro)',
  wallet: 'Carteira Digital',
  doacao: 'Doação / Cortesia',
};

const PAYMENT_LABELS = PAYMENT_METHOD_LABELS;

export function computeShopStats(products: ShopProduct[], orders: ShopOrder[]): ShopStats {
  let grossRevenueCents = 0;
  let netRevenueCents = 0;
  let discountsGrantedCents = 0;
  let paidOrdersCount = 0;
  let donationsCount = 0;
  let pendingDeliveries = 0;
  let deliveredOrders = 0;
  let unitsSold = 0;
  let donatedUnits = 0;

  const productMap = new Map<string, ProductSalesRank>();
  const paymentMap = new Map<ShopOrder['paymentMethod'], PaymentBreakdownRow>();

  for (const order of orders) {
    if (order.delivered) deliveredOrders += 1;
    else pendingDeliveries += 1;

    const isDonation = order.paymentMethod === 'doacao' || order.paymentStatus === 'donation';
    if (isDonation) {
      donationsCount += 1;
    } else {
      paidOrdersCount += 1;
      grossRevenueCents += order.subtotalCents;
      netRevenueCents += order.totalCents;
      discountsGrantedCents += order.discountCents;
    }

    const pRow = paymentMap.get(order.paymentMethod) || {
      method: order.paymentMethod,
      label: PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod,
      ordersCount: 0,
      revenueCents: 0,
    };
    pRow.ordersCount += 1;
    pRow.revenueCents += isDonation ? 0 : order.totalCents;
    paymentMap.set(order.paymentMethod, pRow);

    for (const item of order.items) {
      if (isDonation) {
        donatedUnits += item.quantity;
        continue;
      }
      unitsSold += item.quantity;
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        unitsSold: 0,
        revenueCents: 0,
      };
      existing.unitsSold += item.quantity;
      existing.revenueCents += item.unitPriceCents * item.quantity;
      productMap.set(item.productId, existing);
    }
  }

  let totalStockUnits = 0;
  let outOfStockCount = 0;
  const lowStockVariants: LowStockVariant[] = [];

  for (const prod of products) {
    for (const variant of prod.sizes) {
      totalStockUnits += Math.max(0, variant.stock);
      if (variant.stock <= 0) {
        outOfStockCount += 1;
      }
      if (prod.active && variant.stock <= 5) {
        lowStockVariants.push({
          productId: prod.id,
          productName: prod.name,
          size: variant.size,
          stock: variant.stock,
          active: prod.active,
        });
      }
    }
  }

  lowStockVariants.sort((a, b) => a.stock - b.stock);

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueCents - a.revenueCents)
    .slice(0, 6);

  const paymentBreakdown = Array.from(paymentMap.values()).sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    totalOrders: orders.length,
    paidOrdersCount,
    donationsCount,
    pendingDeliveries,
    deliveredOrders,
    grossRevenueCents,
    netRevenueCents,
    discountsGrantedCents,
    averageTicketCents: paidOrdersCount > 0 ? Math.round(netRevenueCents / paidOrdersCount) : 0,
    unitsSold,
    donatedUnits,
    activeProductsCount: products.filter((p) => p.active).length,
    totalStockUnits,
    lowStockVariants,
    outOfStockCount,
    topProducts,
    paymentBreakdown,
  };
}

export function isMemberSubscriptionValid(user: UserProfile, referenceTimeMs = Date.now()): boolean {
  if (!user.membershipActive || user.membershipTier === 'none') return false;
  if (!user.membershipValidUntil) return true;
  const validUntilMs = new Date(user.membershipValidUntil).getTime();
  return Number.isNaN(validUntilMs) ? true : validUntilMs > referenceTimeMs;
}

export function computeClubStats(
  members: UserProfile[],
  orders: ShopOrder[],
  tickets: Ticket[],
  referenceTimeMs = Date.now(),
): ClubStats {
  const tierMap = new Map<Exclude<MembershipTier, 'none'>, ClubTierBreakdown>();
  for (const plan of CLUB_PLANS) {
    tierMap.set(plan.tier, {
      tier: plan.tier,
      name: plan.name,
      themeColor: plan.themeColor,
      accentColor: plan.accentColor,
      membersCount: 0,
      monthlyCount: 0,
      semesterCount: 0,
      mrrCents: 0,
    });
  }

  let activeSubscribers = 0;
  let calourosCount = 0;
  let mrrCents = 0;

  for (const member of members) {
    if (member.isCalouro) calourosCount += 1;
    if (!isMemberSubscriptionValid(member, referenceTimeMs)) continue;
    const tier = member.membershipTier;
    if (tier === 'none') continue;

    activeSubscribers += 1;
    const cycle = member.membershipCycle || 'mensal';
    const cyclePrice = getPlanPriceCents(tier, cycle);
    const monthlyEquivalent = cycle === 'semestral' ? Math.round(cyclePrice / 6) : cyclePrice;
    mrrCents += monthlyEquivalent;

    const bucket = tierMap.get(tier);
    if (bucket) {
      bucket.membersCount += 1;
      if (cycle === 'semestral') bucket.semesterCount += 1;
      else bucket.monthlyCount += 1;
      bucket.mrrCents += monthlyEquivalent;
    }
  }

  const orderDiscounts = orders.reduce((acc, o) => acc + Math.max(0, o.discountCents), 0);
  const ticketDiscounts = tickets.reduce((acc, t) => {
    if (!t.discountReason) return acc;
    // Registra economia explícita quando desconto 10% ou gratuidade aplicada
    return acc + (t.paidCents > 0 ? Math.round(t.paidCents / 9) : 0);
  }, 0);

  const totalRegisteredUsers = members.length;
  const conversionRatePercent =
    totalRegisteredUsers > 0 ? Math.round((activeSubscribers / totalRegisteredUsers) * 100) : 0;

  return {
    totalRegisteredUsers,
    activeSubscribers,
    inactiveOrNonMembers: Math.max(0, totalRegisteredUsers - activeSubscribers),
    conversionRatePercent,
    calourosCount,
    mrrCents,
    projectedAnnualCents: mrrCents * 12,
    totalDiscountsSavedCents: orderDiscounts + ticketDiscounts,
    tierBreakdown: Array.from(tierMap.values()),
  };
}

export function computeEventStats(
  event: CambluEvent,
  allTickets: Ticket[],
  allCertificates: CertificateRecord[],
): EventStats {
  const eventTickets = allTickets.filter((t) => t.eventId === event.id && t.status !== 'cancelled');
  const eventCerts = allCertificates.filter((c) => c.eventId === event.id);

  const totalLotQuantity = event.lots.reduce((acc, l) => acc + l.totalQuantity, 0);
  const soldFromLots = event.lots.reduce((acc, l) => acc + l.soldQuantity, 0);
  const soldCount = Math.max(soldFromLots, eventTickets.length);
  const capacityBase = event.maxCapacity || totalLotQuantity;
  const remainingCount = Math.max(0, totalLotQuantity - soldFromLots);
  const occupancyPercent = capacityBase > 0 ? Math.min(100, Math.round((soldCount / capacityBase) * 100)) : 0;

  const grossRevenueCents =
    eventTickets.reduce((acc, t) => acc + t.paidCents, 0) ||
    event.lots.reduce((acc, l) => acc + l.soldQuantity * l.priceCents, 0);

  let totalQrSlots = 0;
  let checkedInQrCount = 0;
  let uniqueAttendeesCheckedIn = 0;

  for (const ticket of eventTickets) {
    totalQrSlots += ticket.qrInstances.length;
    const checkedHere = ticket.qrInstances.filter((q) => Boolean(q.checkedInAt)).length;
    checkedInQrCount += checkedHere;
    if (checkedHere > 0) uniqueAttendeesCheckedIn += 1;
  }

  const totalCertifiedHours = eventCerts.reduce((acc, c) => acc + c.totalHours, 0);

  return {
    totalCapacity: capacityBase,
    totalLotQuantity,
    soldCount,
    remainingCount,
    occupancyPercent,
    grossRevenueCents,
    issuedTicketsCount: eventTickets.length,
    totalQrSlots,
    checkedInQrCount,
    uniqueAttendeesCheckedIn,
    certificatesIssuedCount: eventCerts.length,
    totalCertifiedHours,
  };
}
