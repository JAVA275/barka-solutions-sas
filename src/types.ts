export type TabType = 'accueil' | 'services' | 'tarifs' | 'devis' | 'galerie' | 'contact' | 'apropos';

export type UserRole = 'ADMIN' | 'EDITOR';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
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

  // Backward compatibility helpers
  name?: string;
  legalForm?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
  hoursWeekday?: string;
  hoursSaturday?: string;
  hoursSunday?: string;
}

// Backward compatibility alias
export type CompanyInfo = CompanySettings;

export type PricePricingType = 'FIXED' | 'STARTING_AT' | 'CUSTOM_QUOTE';

export interface PriceGridItem {
  id: string;
  name: string;
  category: string;
  format?: string;
  specs?: string;
  unitPrice: number | string;
  unit?: string;
  priceType?: PricePricingType;
  minQty?: string;
  popular?: boolean;
  notes?: string;
  active?: boolean;
}

export interface PriceCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  items: PriceGridItem[];
}

export type ServiceGroupId = 'imprimerie' | 'communication-branding' | 'solutions-pro';

export interface ServiceGroup {
  id: ServiceGroupId;
  number: string;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
}

export interface ServiceItem {
  id: string;
  groupId: ServiceGroupId;
  groupTitle: string;
  category: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  image: string;
  features: string[];
  popular?: boolean;
  active?: boolean;
  priceStartingAt?: number;
  specs?: string[];
  sampleDeliverables?: string[];
  quoteTypePrestation?: string;
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

export interface UploadedFileInfo {
  id: string;
  originalName: string;
  storedName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;
}

export interface QuoteFormData {
  // Étape 1 : Client
  nom: string;
  prenom?: string;
  nomComplet?: string; // alias calculé
  entreprise?: string;
  telephone: string;
  email?: string;
  ville: string;

  // Étape 2 : Projet
  typePrestation: string;
  produit?: string;
  quantite: number;
  format: string;
  supportPapier?: string;
  grammage?: string;
  impressionType?: 'Recto seul' | 'Recto/Verso';
  finition: string;
  delai: string;
  livraisonOption?: 'Retrait en agence (Ngaoundéré)' | 'Livraison Ngaoundéré (+2 000 FCFA)' | 'Expédition inter-villes (+5 000 FCFA)';
  graphismeOption?: 'Fichier prêt fourni (HD)' | 'Conception graphique par BARKA (+10 000 FCFA)';
  description?: string;

  // Étape 3 : Fichiers
  piecesJointes?: File[];
  uploadedFilesInfo?: UploadedFileInfo[];

  // Étape 4 : Calculs
  estimatedPrice?: number;
  priceType?: PricePricingType;

  // Anti-bot & honeypot fields
  barka_hp_check?: string;
  _form_rendered_at?: number;
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
  // Backward compatibility strings:
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

export interface SubmittedQuote extends QuoteFormData {
  id: string; // ex: BKS-2026-00001
  submittedAt: string;
  status: QuoteStatus;
  adminNotes?: string;
  finalPrice?: number;
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

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  comment: string;
  rating: number;
  date: string;
  project: string;
}

export interface ServerStats {
  totalQuotes: number;
  newQuotes: number;
  inAnalysis?: number;
  inPrep?: number;
  sent?: number;
  waitingClient?: number;
  accepted?: number;
  inProduction?: number;
  inProgress?: number;
  completed: number;
  cancelled?: number;
  totalEstimatedRevenue: number;
  messagesCount: number;
  unreadMessages: number;
  servicesCount?: number;
  portfolioCount?: number;
  dbMode?: string;
  isPostgres?: boolean;
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

export interface AuditFilterOptions {
  resource?: string;
  action?: string;
  role?: string;
  username?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

