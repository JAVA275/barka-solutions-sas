export type UserRole = 'ADMIN' | 'EDITOR';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  company_name: string;
  legal_name: string;
  tagline: string;
  slogan: string;
  address: string;
  city: string;
  country: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp: string;
  whatsapp_raw: string;
  email_primary: string;
  email_secondary: string;
  website: string;
  logo: string;
  opening_hours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  social_links: {
    whatsapp?: string;
    facebook?: string;
    linkedin?: string;
    email?: string;
  };
}

export type PricePricingType = 'FIXED' | 'STARTING_AT' | 'CUSTOM_QUOTE';

export interface UploadedFileMeta {
  id: string;
  originalName: string;
  storedName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export type QuoteStatus =
  | 'NOUVEAU'
  | 'EN_ANALYSE'
  | 'DEVIS_EN_PREPARATION'
  | 'DEVIS_ENVOYE'
  | 'EN_ATTENTE_CLIENT'
  | 'ACCEPTE'
  | 'EN_PRODUCTION'
  | 'TERMINE'
  | 'ANNULE'
  | 'Nouveau'
  | 'En cours'
  | 'Traité'
  | 'Archivé'
  | 'Annulé';

export interface StatusHistoryEntry {
  status: QuoteStatus;
  changedAt: string;
  changedBy?: string;
  note?: string;
}

export type PortfolioCategory =
  | 'Imprimerie'
  | 'Offset'
  | 'Numérique'
  | 'Sérigraphie'
  | 'Grand format'
  | 'Branding'
  | 'Signalétique'
  | 'Conception graphique'
  | 'Communication'
  | 'Autres'
  | 'Impression'
  | 'Papeterie'
  | 'Goodies';

export interface PortfolioItem {
  id: string;
  title: string;
  category: PortfolioCategory;
  categories?: string[];
  description: string;
  image: string;
  images?: string[];
  client?: string;
  year?: string;
  tags?: string[];
  serviceAssocie?: string;
  serviceId?: string;
  featured?: boolean;
  active?: boolean;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmittedQuote {
  id: string; // ex: BKS-2026-00001
  nom: string;
  prenom?: string;
  nomComplet: string;
  entreprise?: string;
  telephone: string;
  email?: string;
  ville: string;
  typePrestation: string;
  produit?: string;
  quantite: number;
  format: string;
  supportPapier?: string;
  grammage?: string;
  impressionType?: 'Recto seul' | 'Recto/Verso';
  finition: string;
  delai: string;
  livraisonOption?: string;
  graphismeOption?: string;
  description?: string;
  estimatedPrice?: number;
  priceType?: PricePricingType;
  finalPrice?: number;
  files?: UploadedFileMeta[];
  submittedAt: string;
  status: QuoteStatus;
  adminNotes?: string;
  statusHistory?: StatusHistoryEntry[];
}

export interface ContactMessage {
  id: string;
  name: string;
  emailOrPhone: string;
  subject?: string;
  message: string;
  createdAt: string;
  read: boolean;
  adminReply?: string;
}

export interface ServiceItem {
  id: string;
  groupId: string;
  groupTitle: string;
  category: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  image: string;
  popular?: boolean;
  active?: boolean;
  priceStartingAt?: number;
  features: string[];
  sampleDeliverables: string[];
  quoteTypePrestation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceGridItem {
  id: string;
  name: string;
  category: string;
  format?: string;
  specs?: string;
  unitPrice: number;
  unit: string;
  popular?: boolean;
  active?: boolean;
  minQty?: number;
  order?: number;
}

export interface PriceCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  items: PriceGridItem[];
  order?: number;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  comment: string;
  rating: number;
  date: string;
  project?: string;
  createdAt?: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOGGLE_STATUS';

export type AuditResource =
  | 'TARIF'
  | 'PORTFOLIO'
  | 'DEVIS'
  | 'SERVICE'
  | 'USER'
  | 'COMPANY_SETTINGS'
  | 'MESSAGE'
  | 'AUTH';

export interface AuditLog {
  id: string;
  userId?: string;
  username: string;
  userFullName?: string;
  role: UserRole | 'SYSTEM';
  action: AuditAction | string;
  resource: AuditResource | string;
  resourceId: string;
  resourceTitle?: string;
  description: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress?: string;
  createdAt: string;
}

