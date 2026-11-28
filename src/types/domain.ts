export type UserAffiliation = 'FURB' | 'externo';

export type TShirtSize = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG' | 'XXG' | 'Baby Look P' | 'Baby Look M' | 'Baby Look G';

export type MembershipTier = 'none' | 'comum' | 'raro' | 'epico' | 'lendario';

export type MembershipCycle = 'mensal' | 'semestral';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  cpf: string; // normalized 11 digits
  phone: string; // digits only with DDD
  affiliation: UserAffiliation;
  turma?: string; // digits only when affiliation === 'FURB'
  isCalouro: boolean;
  tshirtSize?: TShirtSize;
  enrollmentSummaryUrl?: string;
  enrollmentSummaryFileName?: string;
  enrollmentSummaryUploadedAt?: string;
  enrollmentVerified?: boolean;
  enrollmentVerifiedAt?: string;
  enrollmentVerifiedUntil?: string | null;
  enrollmentVerificationSemester?: string;
  enrollmentVerificationReason?: string;
  membershipTier: MembershipTier;
  membershipCycle?: MembershipCycle;
  membershipValidUntil?: string | null;
  membershipSubscribedAt?: string | null;
  membershipActive: boolean;
  role: 'student' | 'admin';
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventQrDefinition {
  id: string;
  label: string;
  dateTime: string; // ISO string
  certificateHours: number;
}

export interface EventLot {
  id: string;
  name: string;
  priceCents: number; // Stripe fees absorbed by CAMBLU
  totalQuantity: number;
  soldQuantity: number;
  qrCodesPerTicket: number;
  qrDefinitions: EventQrDefinition[];
  active: boolean;
}

export interface CertificateFieldPosition {
  xPercent: number; // 0..100 from left
  yPercent: number; // 0..100 from top
  fontSizePt: number;
  widthPercent?: number; // 15..95 max printable width box
  colorHex: string;
  align: 'left' | 'center' | 'right';
}

export interface CertificateTemplateConfig {
  templateImageUrl: string; // PNG exported from Canva
  templateWidthPx: number;
  templateHeightPx: number;
  fields: {
    name: CertificateFieldPosition;
    cpf: CertificateFieldPosition;
    hours: CertificateFieldPosition;
    code: CertificateFieldPosition;
    qr?: {
      xPercent: number;
      yPercent: number;
      sizePercent: number;
    };
  };
}

export interface EventPaletteConfig {
  primary: string;
  secondary1: string;
  secondary2: string;
  background: string;
}

/** Alias mantido para compatibilidade com documentos antigos da SECIMED. */
export type SecimedPaletteConfig = EventPaletteConfig;

export interface CambluEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  maxCapacity: number;
  mode: 'presencial' | 'virtual' | 'misto';
  locationShort: string;
  mapsUrl?: string;
  virtualAccessUrl?: string;
  virtualRevealAt?: string;
  category: 'camblu_coffee' | 'secimed' | 'academico' | 'integracao';
  isSecimed: boolean;
  hasCoffee: boolean;
  archived?: boolean;
  qrScannerHidden?: boolean;
  palette?: EventPaletteConfig;
  secimedPalette?: EventPaletteConfig;
  secimedFeaturePhotos?: Record<string, string>;
  startAt: string;
  endAt: string;
  lots: EventLot[];
  certificateTemplate?: CertificateTemplateConfig;
  published: boolean;
  createdAt: string;
}

export interface TicketQrInstance {
  qrCode: string;
  definitionId: string;
  label: string;
  dateTime: string;
  certificateHours: number;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
}

export interface TicketTransferLog {
  fromUid: string;
  fromCpf: string;
  toUid: string;
  toCpf: string;
  transferredAt: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  lotId: string;
  lotName: string;
  ownerUid: string;
  ownerName: string;
  ownerCpf: string;
  ownerEmail: string;
  paidCents: number;
  discountReason?: string;
  status: 'valid' | 'used' | 'cancelled';
  qrInstances: TicketQrInstance[];
  transferHistory: TicketTransferLog[];
  purchasedAt: string;
}

export interface CertificateRecord {
  id: string;
  code: string;
  ticketId: string;
  eventId: string;
  eventTitle: string;
  eventDateLabel: string;
  ownerUid: string;
  ownerName: string;
  ownerCpf: string;
  totalHours: number;
  issuedAt: string;
  templateConfig?: CertificateTemplateConfig;
}

export interface ProductSizeStock {
  size: string;
  stock: number;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ShopProductImageBlocks {
  furb_individual?: string[];
  furb_group?: string[];
  studio_gradient?: string[];
}

export interface ShopProduct {
  id: string;
  slug?: string;
  name: string;
  description: string;
  priceCents: number; // Stripe fees absorbed by CAMBLU
  images: string[];
  imageBlocks?: ShopProductImageBlocks;
  aiReferenceImageUrl?: string;
  aiReferenceImageUrls?: string[];
  sizes: ProductSizeStock[];
  colors?: ProductColorOption[];
  details?: string[];
  careNotes?: string;
  category: string;
  active: boolean;
  createdAt?: string;
}

export interface ShopOrderItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
}

export interface ShopOrder {
  id: string;
  buyerUid: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: ShopOrderItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: 'stripe_card' | 'stripe_pix' | 'wallet' | 'externo_pix' | 'doacao';
  paymentStatus: 'pending' | 'paid' | 'donation';
  delivered: boolean;
  deliveredAt?: string | null;
  notes?: string;
  createdAt: string;
}

export type TransparencyType = 'receita' | 'despesa' | 'ativo' | 'passivo';

export interface TransparencyEntry {
  id: string;
  sheet: string; // e.g., 'Dezembro', 'Janeiro', ..., 'Novembro', 'SECIMED'
  year: number;
  date: string; // YYYY-MM-DD
  type: TransparencyType;
  category: string; // typeable + saved suggestions
  description: string;
  amountCents: number;
  createdAt: string;
}

export interface TransparencyMeta {
  driveMinutesUrl: string;
  spreadsheetUrl?: string;
  lastSyncedAt?: string;
  currentBalanceCents: number;
  projectedBalanceCents: number;
  investedBalanceCents: number;
  savedCategories: string[];
  aiCategorizationModel?: string;
  aiCategorizedAt?: string;
  updatedAt: string;
}

export interface EditalItem {
  id: string;
  title: string;
  program: string;
  summary: string;
  status: 'aberto' | 'encerrado' | 'em_breve';
  deadline: string;
  pdfUrl: string;
  formsUrl: string;
  publishedAt: string;
}

export interface AnaisEdition {
  id: string;
  editionTitle: string; // e.g. XXIII SECIMED (2026)
  year: number;
  issn: string;
  summary: string;
  pdfUrl: string;
  coverImageUrl?: string;
  zenodoUrl?: string;
  publishedAt: string;
}

export type GestaoCargo =
  | 'Presidente'
  | 'Vice-Presidente'
  | 'Tesoureiro(a)'
  | 'Secretário(a) Geral'
  | 'Secretário(a) Adjunto(a)'
  | 'Diretoria de Comunicações Externas'
  | 'Diretoria de Assuntos Acadêmicos'
  | 'Diretoria de Políticas Científicas'
  | 'Diretoria de Patrimônio'
  | 'Diretoria de Filantropia'
  | 'Diretoria de Comunicação e Marketing'
  | 'Diretoria de Ligas Acadêmicas'
  | 'Diretoria de Eventos'
  | 'Treineiro(a)';

export type M3ShapeVariant =
  | 'circle'
  | 'squircle'
  | 'pill'
  | 'arch'
  | 'clover4'
  | 'clover8'
  | 'flower'
  | 'gem'
  | 'sunny';

export interface GestaoMember {
  id: string;
  name: string;
  cargo: GestaoCargo;
  instagram?: string;
  photoUrl: string; // 1:1 cropped image or placeholder
  shape: M3ShapeVariant;
}

export interface GestaoTerm {
  id: string;
  year: number;
  chapaName: string;
  instagram?: string;
  mission?: string;
  proposals?: string[];
  members: GestaoMember[];
  createdAt?: string;
}

export interface LigaAcademica {
  id: string;
  acronym: string;
  name: string;
  area: 'Clínica' | 'Cirúrgica' | 'Saúde Coletiva & Mental' | 'Pediatria & GO' | 'Diagnóstico & Básicas';
  instagramUrl: string;
  instagramHandle: string;
  logoUrl?: string;
  shape: M3ShapeVariant;
  description?: string;
}

export type DemandTopic =
  | 'Demanda de turma'
  | 'Demanda pessoal'
  | 'Dúvida'
  | 'Reclamação'
  | 'CAMBLU Mulher';

export interface DemandSubmission {
  id: string;
  topic: DemandTopic;
  senderName?: string;
  senderEmail?: string;
  turma?: string;
  anonymous: boolean;
  message: string;
  createdAt: string;
  dispatchedEmail: boolean;
}

export interface ClubPromotion {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  goalCount: number;
  turmas: string[];
  prizeName: string;
  isTshirtPrize: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubPromotionTurmaProgress {
  turma: string;
  count: number;
  goalCount: number;
  percent: number;
  goalReached: boolean;
}
