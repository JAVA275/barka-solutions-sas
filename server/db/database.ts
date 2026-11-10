import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import {
  User,
  CompanySettings,
  SubmittedQuote,
  ContactMessage,
  PortfolioItem,
  QuoteStatus,
  ServiceItem,
  PriceCategory,
  PriceGridItem,
  Testimonial,
  AuditLog,
} from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../config/companySettings';
import { hashPassword, comparePassword } from '../services/auth';
import { DEFAULT_SERVICES, DEFAULT_PRICE_CATEGORIES, DEFAULT_TESTIMONIALS } from '../data/defaultCatalog';
import { pgManager } from './postgres';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

interface DatabaseStore {
  users: User[];
  companySettings: CompanySettings;
  quotes: SubmittedQuote[];
  messages: ContactMessage[];
  portfolio: PortfolioItem[];
  services: ServiceItem[];
  priceCategories: PriceCategory[];
  testimonials: Testimonial[];
  auditLogs: AuditLog[];
  lastQuoteSequence: number;
}

export function normalizeQuoteStatus(status?: string): QuoteStatus {
  if (!status) return 'NOUVEAU';
  const upper = status.trim();
  const mapping: Record<string, QuoteStatus> = {
    'NOUVEAU': 'NOUVEAU',
    'EN_ANALYSE': 'EN_ANALYSE',
    'DEVIS_EN_PREPARATION': 'DEVIS_EN_PREPARATION',
    'DEVIS_ENVOYE': 'DEVIS_ENVOYE',
    'EN_ATTENTE_CLIENT': 'EN_ATTENTE_CLIENT',
    'ACCEPTE': 'ACCEPTE',
    'EN_PRODUCTION': 'EN_PRODUCTION',
    'TERMINE': 'TERMINE',
    'ANNULE': 'ANNULE',
    'Nouveau': 'NOUVEAU',
    'En cours': 'EN_PRODUCTION',
    'Traité': 'TERMINE',
    'Archivé': 'TERMINE',
    'Annulé': 'ANNULE',
  };
  return mapping[upper] || 'NOUVEAU';
}

export const ALLOWED_QUOTE_TRANSITIONS: Record<string, QuoteStatus[]> = {
  'NOUVEAU': ['EN_ANALYSE', 'DEVIS_EN_PREPARATION', 'DEVIS_ENVOYE', 'EN_ATTENTE_CLIENT', 'ACCEPTE', 'EN_PRODUCTION', 'ANNULE', 'NOUVEAU'],
  'EN_ANALYSE': ['DEVIS_EN_PREPARATION', 'DEVIS_ENVOYE', 'EN_ATTENTE_CLIENT', 'ACCEPTE', 'EN_PRODUCTION', 'ANNULE', 'NOUVEAU'],
  'DEVIS_EN_PREPARATION': ['DEVIS_ENVOYE', 'EN_ATTENTE_CLIENT', 'ACCEPTE', 'EN_PRODUCTION', 'ANNULE', 'EN_ANALYSE', 'DEVIS_EN_PREPARATION'],
  'DEVIS_ENVOYE': ['EN_ATTENTE_CLIENT', 'ACCEPTE', 'EN_PRODUCTION', 'ANNULE', 'DEVIS_EN_PREPARATION', 'DEVIS_ENVOYE'],
  'EN_ATTENTE_CLIENT': ['ACCEPTE', 'DEVIS_EN_PREPARATION', 'EN_PRODUCTION', 'ANNULE', 'EN_ANALYSE', 'EN_ATTENTE_CLIENT'],
  'ACCEPTE': ['EN_PRODUCTION', 'TERMINE', 'ANNULE', 'ACCEPTE'],
  'EN_PRODUCTION': ['TERMINE', 'ANNULE', 'ACCEPTE', 'EN_PRODUCTION'],
  'TERMINE': ['TERMINE', 'ANNULE'],
  'ANNULE': ['NOUVEAU', 'EN_ANALYSE', 'ANNULE'],
};

export function isValidQuoteStatusTransition(currentStatus: QuoteStatus, newStatus: QuoteStatus): boolean {
  const normCurrent = normalizeQuoteStatus(currentStatus);
  const normNew = normalizeQuoteStatus(newStatus);
  if (normCurrent === normNew) return true;
  const allowed = ALLOWED_QUOTE_TRANSITIONS[normCurrent];
  return !!allowed && allowed.includes(normNew);
}

class AsyncMutex {
  private queue = Promise.resolve();

  lock(): Promise<() => void> {
    let unlock: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const willLock = this.queue.then(() => unlock);
    this.queue = this.queue.then(() => nextLock);
    return willLock;
  }
}

class Database {
  private store: DatabaseStore = {
    users: [],
    companySettings: { ...DEFAULT_COMPANY_SETTINGS },
    quotes: [],
    messages: [],
    portfolio: [],
    services: [...DEFAULT_SERVICES],
    priceCategories: [...DEFAULT_PRICE_CATEGORIES],
    testimonials: [...DEFAULT_TESTIMONIALS],
    auditLogs: [],
    lastQuoteSequence: 0,
  };
  private quoteLock = new AsyncMutex();
  private isInitialized = false;

  constructor() {
    this.store.portfolio = this.getSeededPortfolio();
    this.init();
  }

  private async init() {
    try {
      if (!process.env.VERCEL) {
        try {
          if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
          }
        } catch {
          // Ignore EROFS or filesystem permissions errors in read-only runtimes
        }
      }

      // 1. Load store.json as baseline local state
      let loadedFromDisk = false;
      try {
        if (fs.existsSync(DB_FILE)) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.store = {
              ...this.store,
              ...parsed,
              portfolio: Array.isArray(parsed.portfolio) && parsed.portfolio.length > 0 ? parsed.portfolio : this.getSeededPortfolio(),
              services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : [...DEFAULT_SERVICES],
              priceCategories: Array.isArray(parsed.priceCategories) && parsed.priceCategories.length > 0 ? parsed.priceCategories : [...DEFAULT_PRICE_CATEGORIES],
              testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : [...DEFAULT_TESTIMONIALS],
            };
            loadedFromDisk = true;
            console.log(`[DB] 💾 Données de départ chargées (${this.store.quotes?.length || 0} devis, ${this.store.portfolio?.length || 0} réalisations, ${this.store.services?.length || 0} services)`);
          }
        }
      } catch (e: any) {
        console.warn('⚠️ [DB] Lecture store.json impossible, utilisation du catalogue par défaut :', e.message);
      }

      if (!loadedFromDisk) {
        await this.seedInitialData();
        this.persist();
      }

      // Ensure admin exists
      if (!this.store.users || this.store.users.length === 0) {
        await this.seedInitialData();
        this.persist();
      }

      // Ensure company settings exist
      if (!this.store.companySettings) {
        this.store.companySettings = { ...DEFAULT_COMPANY_SETTINGS };
        this.persist();
      }

      // Ensure portfolio exists
      if (!this.store.portfolio || this.store.portfolio.length === 0) {
        this.store.portfolio = this.getSeededPortfolio();
        this.persist();
      }

      // Ensure services exist
      if (!this.store.services || this.store.services.length === 0) {
        this.store.services = [...DEFAULT_SERVICES];
        this.persist();
      }

      // Ensure price categories exist
      if (!this.store.priceCategories || this.store.priceCategories.length === 0) {
        this.store.priceCategories = [...DEFAULT_PRICE_CATEGORIES];
        this.persist();
      }

      // Ensure testimonials exist
      if (!this.store.testimonials || this.store.testimonials.length === 0) {
        this.store.testimonials = [...DEFAULT_TESTIMONIALS];
        this.persist();
      }

      // Normalize quote statuses in store
      if (this.store.quotes && Array.isArray(this.store.quotes)) {
        let modifiedQuotes = false;
        this.store.quotes = this.store.quotes.map((q) => {
          const normStatus = normalizeQuoteStatus(q.status);
          const normHistory = Array.isArray(q.statusHistory)
            ? q.statusHistory.map((h) => ({ ...h, status: normalizeQuoteStatus(h.status) }))
            : [{ status: normStatus, changedAt: q.submittedAt, note: 'Création initiale' }];

          if (q.status !== normStatus) {
            modifiedQuotes = true;
          }
          return {
            ...q,
            status: normStatus,
            statusHistory: normHistory,
          };
        });
        if (modifiedQuotes) {
          this.persist();
        }
      }

      // 2. Connect to PostgreSQL and execute migrations & seeding if available
      const isPg = await pgManager.checkConnection();
      if (isPg) {
        await pgManager.runMigrations();
        await pgManager.seedFromStoreIfEmpty();
        await this.loadFromPostgres();
      } else {
        console.log('ℹ️ [DB] Mode PostgreSQL prêt. Fallback local / store.json actif.');
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('[DB] Erreur initialisation base de données:', err);
      await this.seedInitialData();
    }
  }

  private async loadFromPostgres() {
    try {
      // Load Users
      const usersRes = await pgManager.query('SELECT * FROM users ORDER BY created_at ASC');
      if (usersRes.rows.length > 0) {
        this.store.users = usersRes.rows.map((row) => ({
          id: row.id,
          username: row.username,
          email: row.email,
          passwordHash: row.password_hash,
          fullName: row.full_name,
          role: row.role,
          avatarUrl: row.avatar_url,
          isActive: row.is_active,
          lastLogin: row.last_login?.toISOString(),
          createdAt: row.created_at?.toISOString(),
          updatedAt: row.updated_at?.toISOString(),
        }));
      }

      // Load Company Settings
      const companyRes = await pgManager.query('SELECT * FROM company_settings LIMIT 1');
      if (companyRes.rows.length > 0) {
        const row = companyRes.rows[0];
        this.store.companySettings = {
          company_name: row.company_name,
          legal_name: row.legal_name,
          tagline: row.tagline,
          slogan: row.slogan,
          address: row.address,
          city: row.city,
          country: row.country,
          phone_primary: row.phone_primary,
          phone_secondary: row.phone_secondary,
          whatsapp: row.whatsapp,
          whatsapp_raw: row.whatsapp_raw || '237696311198',
          email_primary: row.email_primary,
          email_secondary: row.email_secondary,
          website: row.website || '',
          logo: row.logo_url || '/assets/logo-barka.png',
          opening_hours: row.opening_hours || DEFAULT_COMPANY_SETTINGS.opening_hours,
          social_links: row.social_links || DEFAULT_COMPANY_SETTINGS.social_links,
        };
      }

      // Load Services
      const servicesRes = await pgManager.query('SELECT * FROM services ORDER BY created_at ASC');
      if (servicesRes.rows.length > 0) {
        this.store.services = servicesRes.rows.map((row) => ({
          id: row.id,
          groupId: row.group_id,
          groupTitle: row.group_title,
          category: row.category,
          title: row.title,
          shortDesc: row.short_desc,
          fullDesc: row.full_desc,
          iconName: row.icon_name,
          image: row.image_url,
          priceStartingAt: Number(row.price_starting_at) || 0,
          popular: row.popular,
          active: row.active,
          features: row.features || [],
          sampleDeliverables: row.sample_deliverables || [],
          quoteTypePrestation: row.quote_type_prestation,
          createdAt: row.created_at?.toISOString(),
          updatedAt: row.updated_at?.toISOString(),
        }));
      }

      // Load Portfolio
      const portfolioRes = await pgManager.query('SELECT * FROM portfolio ORDER BY created_at DESC');
      if (portfolioRes.rows.length > 0) {
        this.store.portfolio = portfolioRes.rows.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          categories: row.categories || [row.category],
          description: row.description,
          image: row.image_url,
          images: row.images || [row.image_url],
          client: row.client,
          year: row.year,
          tags: row.tags || [],
          serviceAssocie: row.service_associe,
          serviceId: row.service_id,
          featured: row.featured,
          active: row.active,
          isDemo: row.is_demo,
          createdAt: row.created_at?.toISOString(),
          updatedAt: row.updated_at?.toISOString(),
        }));
      }

      // Load Price Categories & Prices
      const catRes = await pgManager.query('SELECT * FROM price_categories ORDER BY sort_order ASC');
      const pricesRes = await pgManager.query('SELECT * FROM prices ORDER BY sort_order ASC');
      if (catRes.rows.length > 0) {
        this.store.priceCategories = catRes.rows.map((cat) => {
          const items = pricesRes.rows
            .filter((p) => p.category_id === cat.id)
            .map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              format: p.format,
              specs: p.specs,
              unitPrice: Number(p.unit_price) || 0,
              unit: p.unit,
              popular: p.popular,
              active: p.active,
              minQty: p.min_qty,
              order: p.sort_order,
            }));
          return {
            id: cat.id,
            name: cat.name,
            iconName: cat.icon_name,
            description: cat.description,
            order: cat.sort_order,
            items,
          };
        });
      }

      // Load Quotes
      const quotesRes = await pgManager.query('SELECT * FROM quotes ORDER BY submitted_at DESC');
      if (quotesRes.rows.length > 0) {
        this.store.quotes = quotesRes.rows.map((row) => ({
          id: row.id,
          nom: row.nom,
          prenom: row.prenom,
          nomComplet: row.nom_complet,
          entreprise: row.entreprise,
          telephone: row.telephone,
          email: row.email,
          ville: row.ville,
          typePrestation: row.type_prestation,
          produit: row.produit,
          quantite: Number(row.quantite) || 1,
          format: row.format,
          supportPapier: row.support_papier,
          grammage: row.grammage,
          impressionType: row.impression_type,
          finition: row.finition,
          delai: row.delai,
          livraisonOption: row.livraison_option,
          graphismeOption: row.graphisme_option,
          description: row.description,
          estimatedPrice: Number(row.estimated_price) || 0,
          priceType: row.price_type,
          finalPrice: row.final_price ? Number(row.final_price) : undefined,
          status: normalizeQuoteStatus(row.status),
          adminNotes: row.admin_notes,
          files: row.files || [],
          statusHistory: row.status_history || [],
          submittedAt: row.submitted_at?.toISOString() || new Date().toISOString(),
        }));
      }

      // Load Messages
      const msgRes = await pgManager.query('SELECT * FROM messages ORDER BY created_at DESC');
      if (msgRes.rows.length > 0) {
        this.store.messages = msgRes.rows.map((row) => ({
          id: row.id,
          name: row.name,
          emailOrPhone: row.email_or_phone,
          subject: row.subject,
          message: row.message,
          read: row.is_read,
          adminReply: row.admin_reply,
          createdAt: row.created_at?.toISOString(),
        }));
      }

      // Load Testimonials
      const testRes = await pgManager.query('SELECT * FROM testimonials WHERE is_approved = true ORDER BY created_at DESC');
      if (testRes.rows.length > 0) {
        this.store.testimonials = testRes.rows.map((row) => ({
          id: row.id,
          author: row.author,
          role: row.role,
          company: row.company,
          avatar: row.avatar_url,
          comment: row.comment,
          rating: row.rating,
          date: row.date_label || '2026',
          project: row.project,
          createdAt: row.created_at?.toISOString(),
        }));
      }

      // Load Audit Logs
      const auditRes = await pgManager.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
      if (auditRes.rows.length > 0) {
        this.store.auditLogs = auditRes.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          username: row.username,
          userFullName: row.user_full_name,
          role: row.role,
          action: row.action,
          resource: row.resource,
          resourceId: row.resource_id,
          resourceTitle: row.resource_title,
          description: row.description,
          oldValue: row.old_value,
          newValue: row.new_value,
          ipAddress: row.ip_address,
          createdAt: row.created_at?.toISOString(),
        }));
      }

      console.log('✅ [PostgreSQL] Données synchronisées avec succès depuis PostgreSQL dans le store.');
      this.persist();
    } catch (err: any) {
      console.warn('⚠️ [PostgreSQL] Erreur lors du chargement des données depuis PostgreSQL :', err.message);
    }
  }

  private getSeededPortfolio(): PortfolioItem[] {
    return [
      {
        id: 'port-001',
        title: 'Brochure & Catalogue d’Entreprise 24 Pages',
        category: 'Offset',
        categories: ['Offset', 'Imprimerie'],
        description: 'Exemple de catalogue institutionnel 24 pages avec papier couché satiné 250g, vernis sélectif et reliure piqûre à cheval soignée.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        ],
        client: 'Spécimen démo (Secteur Agroalimentaire)',
        year: '2026',
        tags: ['Catalogue', 'Brochure', 'Impression Offset', 'Démonstration'],
        serviceAssocie: 'Impression offset & Catalogues',
        serviceId: 'offset',
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      },
      {
        id: 'port-002',
        title: 'Enseigne Lumineuse LED 3D Relief & Totem',
        category: 'Signalétique',
        categories: ['Signalétique', 'Branding'],
        description: 'Exemple d’enseigne rétro-éclairée LED en lettres boîtiers aluminium anodisé et plexiglas diffusant haute visibilité de nuit.',
        image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80',
        ],
        client: 'Spécimen démo (Secteur Hôtellerie)',
        year: '2026',
        tags: ['Enseigne', 'LED', 'Plexiglas', 'Signalétique', 'Démonstration'],
        serviceAssocie: 'Enseignes & Signalétique',
        serviceId: 'enseignes',
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      },
      {
        id: 'port-003',
        title: 'Cartes de Visite Prestige Dorure à Chaud & Soft-Touch',
        category: 'Numérique',
        categories: ['Numérique', 'Papeterie'],
        description: 'Exemple de cartes de visite 400g touché soft-touch avec dorure à chaud dorée et tranche teintée bleu nuit.',
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        ],
        client: 'Spécimen démo (Cabinet Juridique)',
        year: '2026',
        tags: ['Cartes de visite', 'Dorure', 'Soft-touch', 'Luxe', 'Démonstration'],
        serviceAssocie: 'Papeterie d’entreprise',
        serviceId: 'papeterie',
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      },
      {
        id: 'port-004',
        title: 'Roll-up & Banderoles Grand Format pour Salon Pro',
        category: 'Grand format',
        categories: ['Grand format', 'Communication'],
        description: 'Exemple de structures aluminium renforcées avec bâche PVC anti-reflet HD et œillets laiton pour événements professionnels.',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
        ],
        client: 'Spécimen démo (Secteur Événementiel & ONG)',
        year: '2026',
        tags: ['Roll-up', 'Grand Format', 'Salon', 'Événementiel', 'Démonstration'],
        serviceAssocie: 'Grand format & Banderoles',
        serviceId: 'grand-format',
        featured: false,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
      },
      {
        id: 'port-005',
        title: 'T-shirts & Polos Brodés pour Personnel d’Atelier',
        category: 'Sérigraphie',
        categories: ['Sérigraphie', 'Branding'],
        description: 'Exemple de sérigraphie 4 couleurs haute tenue et broderie poitrine de précision sur polos piqués 220g pour tenues professionnelles.',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        ],
        client: 'Spécimen démo (Secteur BTP & Industrie)',
        year: '2026',
        tags: ['Sérigraphie', 'Textile', 'Broderie', 'Polos', 'Démonstration'],
        serviceAssocie: 'Sérigraphie & Textiles',
        serviceId: 'serigraphie',
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
      {
        id: 'port-006',
        title: 'Habillage Intégral de Véhicules Utilitaires (Covering)',
        category: 'Branding',
        categories: ['Branding', 'Signalétique'],
        description: 'Exemple de marquage adhésif coulé 3M avec pelliculage anti-UV longue durée pour flotte de livraison et camions frigorifiques.',
        image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
        ],
        client: 'Spécimen démo (Secteur Distribution Logistique)',
        year: '2026',
        tags: ['Covering', 'Branding Véhicule', 'Flotte', 'Adhésif', 'Démonstration'],
        serviceAssocie: 'Habillage & Covering',
        serviceId: 'habillage',
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      },
    ];
  }

  private async seedInitialData() {
    const adminInitialPass = process.env.ADMIN_INITIAL_PASSWORD?.trim() || crypto.randomBytes(16).toString('hex');
    const editorInitialPass = process.env.EDITOR_INITIAL_PASSWORD?.trim() || crypto.randomBytes(16).toString('hex');

    const adminHash = await hashPassword(adminInitialPass);
    const editorHash = await hashPassword(editorInitialPass);
    const now = new Date().toISOString();

    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.log('------------------------------------------------------------');
      console.log('🔐 [SÉCURITÉ] Compte Administrateur initial généré :');
      console.log(`👉 Identifiant : admin | Mot de passe : ${adminInitialPass}`);
      console.log('👉 Identifiant : editor | Mot de passe : ${editorInitialPass}');
      console.log('------------------------------------------------------------');
    }

    this.store.users = [
      {
        id: '54b240ad-0e23-42b1-9531-78f01e32e309',
        username: 'admin',
        email: 'direction@barkasolutions.org',
        fullName: 'Administrateur Principal BARKA',
        passwordHash: adminHash,
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '345c4630-9876-46bf-bfa5-8211ff295109',
        username: 'editor',
        email: 'kouchoumichel@yahoo.fr',
        fullName: 'Éditeur & Gestionnaire Atelier',
        passwordHash: editorHash,
        role: 'EDITOR',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.store.companySettings = { ...DEFAULT_COMPANY_SETTINGS };
    this.store.services = [...DEFAULT_SERVICES];
    this.store.priceCategories = [...DEFAULT_PRICE_CATEGORIES];
    this.store.testimonials = [...DEFAULT_TESTIMONIALS];
    this.store.portfolio = this.getSeededPortfolio();

    this.store.quotes = [
      {
        id: 'BKS-2026-00001',
        nom: 'Bouba',
        prenom: 'Hamidou',
        nomComplet: 'Hamidou Bouba',
        entreprise: 'Coopérative Agro-Pastorale de Ngaoundéré',
        telephone: '+237 699 12 34 56',
        email: 'h.bouba@coop-agro.cm',
        ville: 'Ngaoundéré',
        typePrestation: 'Carnets factures autocopiants',
        produit: 'Facturiers Dupli A4',
        quantite: 50,
        format: 'A4 (21 x 29.7 cm)',
        supportPapier: 'Dupli (50 feuillets autocopiants)',
        grammage: 'Autocopiant CB/CF 55g',
        impressionType: 'Recto seul',
        finition: 'Numérotation 001 à 2500 + Souche agrafée',
        delai: 'Standard (3-5 jours)',
        livraisonOption: 'Retrait en agence (Ngaoundéré)',
        graphismeOption: 'Fichier prêt fourni (HD)',
        description: 'Facturiers 50 feuillets dupli numérotés de 001 à 2500 avec logo couleur en en-tête.',
        estimatedPrice: 95000,
        priceType: 'FIXED',
        submittedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        status: 'EN_PRODUCTION',
        adminNotes: 'En cours de tirage sur presse offset. Prêt jeudi matin.',
        statusHistory: [
          { status: 'NOUVEAU', changedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), note: 'Enregistrement' },
          { status: 'EN_ANALYSE', changedAt: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString(), note: 'Vérification maquette' },
          { status: 'ACCEPTE', changedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), note: 'Acompte 50% reçu' },
          { status: 'EN_PRODUCTION', changedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), note: 'Montage et tirage' },
        ],
      },
      {
        id: 'BKS-2026-00002',
        nom: 'Bello',
        prenom: 'Aminatou',
        nomComplet: 'Dr. Aminatou Bello',
        entreprise: 'Clinique Médicale Espoir',
        telephone: '+237 677 88 99 00',
        email: 'dr.bello@clinique-espoir.cm',
        ville: 'Ngaoundéré',
        typePrestation: 'Carnets de santé & registres',
        produit: 'Carnets de santé pédiatriques',
        quantite: 200,
        format: 'A5 (14.8 x 21 cm)',
        supportPapier: 'Papier Couché Satiné 300g (Couverture)',
        grammage: 'Intérieur Offset 80g / Couverture 300g',
        impressionType: 'Recto/Verso',
        finition: 'Pelliculage brillant couverture + Deux agrafes',
        delai: 'Express (24-48h)',
        livraisonOption: 'Livraison Ngaoundéré (+2 000 FCFA)',
        graphismeOption: 'Fichier prêt fourni (HD)',
        description: 'Carnets de santé pédiatriques personnalisés avec tableau vaccinal conforme Ministère de la Santé Publique.',
        estimatedPrice: 140000,
        priceType: 'STARTING_AT',
        submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        status: 'NOUVEAU',
        statusHistory: [
          { status: 'NOUVEAU', changedAt: new Date(Date.now() - 3600000 * 6).toISOString(), note: 'Nouvelle demande client' },
        ],
      },
    ];

    this.store.messages = [
      {
        id: 'MSG-001',
        name: 'Sali Mohamadou',
        emailOrPhone: '+237 690 11 22 33',
        subject: 'Demande de devis enseigne lumineuse',
        message: 'Bonjour, réalisez-vous également des enseignes lumineuses LED 3D pour façades de magasins et pharmacies à Ngaoundéré ?',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        read: true,
        adminReply: 'Bonjour, oui tout à fait. Nous fabriquons sur mesure des enseignes lumineuses avec pose sur site.',
      },
    ];

    this.store.auditLogs = [
      {
        id: 'LOG-001',
        userId: '54b240ad-0e23-42b1-9531-78f01e32e309',
        username: 'admin',
        userFullName: 'Administrateur Principal BARKA',
        role: 'ADMIN',
        action: 'UPDATE',
        resource: 'TARIF',
        resourceId: 'price-flyers-a5',
        resourceTitle: 'Flyers / Prospectus A5',
        description: 'ADMIN a modifié un tarif (Flyers / Prospectus A5).',
        oldValue: { unitPrice: 35, popular: false },
        newValue: { unitPrice: 30, popular: true },
        ipAddress: '127.0.0.1',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: 'LOG-002',
        userId: '345c4630-9876-46bf-bfa5-8211ff295109',
        username: 'editor',
        userFullName: 'Éditeur & Gestionnaire Atelier',
        role: 'EDITOR',
        action: 'STATUS_CHANGE',
        resource: 'DEVIS',
        resourceId: 'BKS-2026-00001',
        resourceTitle: 'Devis Coopérative Agro-Pastorale',
        description: "EDITOR a changé le statut d'un devis (#BKS-2026-00001 : ACCEPTE -> EN_PRODUCTION).",
        oldValue: { status: 'ACCEPTE' },
        newValue: { status: 'EN_PRODUCTION', adminNotes: 'En cours de tirage sur presse offset.' },
        ipAddress: '127.0.0.1',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'LOG-003',
        userId: '54b240ad-0e23-42b1-9531-78f01e32e309',
        username: 'admin',
        userFullName: 'Administrateur Principal BARKA',
        role: 'ADMIN',
        action: 'UPDATE',
        resource: 'SERVICE',
        resourceId: 'offset',
        resourceTitle: 'Impression offset & Catalogues',
        description: 'ADMIN a modifié un service (Impression offset & Catalogues).',
        oldValue: { popular: false, priceStartingAt: 30000 },
        newValue: { popular: true, priceStartingAt: 25000 },
        ipAddress: '127.0.0.1',
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      },
      {
        id: 'LOG-004',
        userId: '54b240ad-0e23-42b1-9531-78f01e32e309',
        username: 'admin',
        userFullName: 'Administrateur Principal BARKA',
        role: 'ADMIN',
        action: 'DELETE',
        resource: 'PORTFOLIO',
        resourceId: 'port-old-archive',
        resourceTitle: 'Ancienne Affiche Démo 2024',
        description: 'ADMIN a supprimé un portfolio (Ancienne Affiche Démo 2024).',
        oldValue: { id: 'port-old-archive', title: 'Ancienne Affiche Démo 2024', category: 'Offset' },
        newValue: null,
        ipAddress: '127.0.0.1',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 'LOG-005',
        userId: '54b240ad-0e23-42b1-9531-78f01e32e309',
        username: 'admin',
        userFullName: 'Administrateur Principal BARKA',
        role: 'ADMIN',
        action: 'UPDATE',
        resource: 'COMPANY_SETTINGS',
        resourceId: 'barka-settings',
        resourceTitle: 'Paramètres BARKA SOLUTIONS S.A.S',
        description: "ADMIN a modifié les coordonnées et paramètres de l'entreprise.",
        oldValue: { address: 'Ngaoundéré Centre' },
        newValue: { address: 'Derrière le Restaurant Le Verger, Ngaoundéré, Cameroun' },
        ipAddress: '127.0.0.1',
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
    ];

    this.store.lastQuoteSequence = 2;
  }

  private persist() {
    try {
      if (process.env.VERCEL) {
        try {
          const tmpFile = path.join(os.tmpdir(), 'store.json');
          fs.writeFileSync(tmpFile, JSON.stringify(this.store, null, 2), 'utf-8');
        } catch {
          // Gracefully retain in-memory state
        }
        return;
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn('[DB] Écriture store.json impossible (environnement en lecture seule) :', err.message);
    }
  }

  private reloadFromFileIfNeeded() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const diskStore = JSON.parse(raw);
        if (Array.isArray(diskStore.users)) {
          this.store.users = diskStore.users;
        }
      }
    } catch {}
  }

  // ================= USERS =================
  async findUserByUsername(username: string): Promise<User | null> {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            role: row.role,
            avatarUrl: row.avatar_url,
            isActive: row.is_active,
            lastLogin: row.last_login?.toISOString(),
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
          };
        }
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] findUserByUsername fallback:', err);
      }
    }
    const lower = username.toLowerCase();
    let found = this.store.users.find((u) => u.username.toLowerCase() === lower);
    if (!found) {
      this.reloadFromFileIfNeeded();
      found = this.store.users.find((u) => u.username.toLowerCase() === lower);
    }
    return found || null;
  }

  async findUserById(id: string): Promise<User | null> {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            role: row.role,
            avatarUrl: row.avatar_url,
            isActive: row.is_active,
            lastLogin: row.last_login?.toISOString(),
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
          };
        }
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] findUserById fallback:', err);
      }
    }
    let found = this.store.users.find((u) => u.id === id);
    if (!found) {
      this.reloadFromFileIfNeeded();
      found = this.store.users.find((u) => u.id === id);
    }
    return found || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            role: row.role,
            avatarUrl: row.avatar_url,
            isActive: row.is_active,
            lastLogin: row.last_login?.toISOString(),
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
          };
        }
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] findUserByEmail fallback:', err);
      }
    }
    const lower = email.toLowerCase();
    let found = this.store.users.find((u) => u.email.toLowerCase() === lower);
    if (!found) {
      this.reloadFromFileIfNeeded();
      found = this.store.users.find((u) => u.email.toLowerCase() === lower);
    }
    return found || null;
  }

  async getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query('SELECT id, username, email, full_name, role, avatar_url, is_active, last_login, created_at, updated_at FROM users ORDER BY created_at ASC');
        if (res.rows.length > 0) {
          return res.rows.map((row) => ({
            id: row.id,
            username: row.username,
            email: row.email,
            fullName: row.full_name,
            role: row.role,
            avatarUrl: row.avatar_url,
            isActive: row.is_active,
            lastLogin: row.last_login?.toISOString(),
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
          }));
        }
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] getAllUsers fallback:', err);
      }
    }
    return this.store.users.map(({ passwordHash: _, ...user }) => user);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (pgManager.isPgConnected()) {
      try {
        await pgManager.query(
          `INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [newUser.id, newUser.username, newUser.email, newUser.passwordHash, newUser.fullName, newUser.role, newUser.isActive, now, now]
        );
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] createUser error:', err);
      }
    }

    this.store.users.push(newUser);
    this.persist();
    return newUser;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    if (pgManager.isPgConnected()) {
      try {
        await pgManager.query('UPDATE users SET last_login = $1, updated_at = $1 WHERE id = $2', [now, id]);
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] updateUserLastLogin error:', err);
      }
    }
    const user = this.store.users.find((u) => u.id === id);
    if (user) {
      user.lastLogin = now;
      user.updatedAt = now;
      this.persist();
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    if (pgManager.isPgConnected()) {
      try {
        await pgManager.query('DELETE FROM users WHERE id = $1', [id]);
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] deleteUser error:', err);
      }
    }
    const initialLen = this.store.users.length;
    this.store.users = this.store.users.filter((u) => u.id !== id);
    if (this.store.users.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ================= COMPANY SETTINGS =================
  getCompanySettings(): CompanySettings {
    return { ...this.store.companySettings };
  }

  updateCompanySettings(settings: Partial<CompanySettings>): CompanySettings {
    this.store.companySettings = {
      ...this.store.companySettings,
      ...settings,
      opening_hours: {
        ...this.store.companySettings.opening_hours,
        ...(settings.opening_hours || {}),
      },
      social_links: {
        ...this.store.companySettings.social_links,
        ...(settings.social_links || {}),
      },
    };

    if (pgManager.isPgConnected()) {
      const cs = this.store.companySettings;
      pgManager.query(
        `UPDATE company_settings SET
           company_name = $1, legal_name = $2, tagline = $3, slogan = $4,
           address = $5, city = $6, country = $7, phone_primary = $8,
           phone_secondary = $9, whatsapp = $10, whatsapp_raw = $11,
           email_primary = $12, email_secondary = $13, website = $14,
           logo_url = $15, opening_hours = $16, social_links = $17, updated_at = NOW()`,
        [
          cs.company_name, cs.legal_name, cs.tagline, cs.slogan,
          cs.address, cs.city, cs.country, cs.phone_primary,
          cs.phone_secondary, cs.whatsapp, cs.whatsapp_raw || '237696311198',
          cs.email_primary, cs.email_secondary, cs.website || '',
          cs.logo || '/assets/logo-barka.png',
          JSON.stringify(cs.opening_hours || {}),
          JSON.stringify(cs.social_links || {}),
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] updateCompanySettings error:', err));
    }

    this.persist();
    return this.store.companySettings;
  }

  // ================= QUOTES (DEVIS) =================
  private async getNextQuoteSequence(year: number): Promise<number> {
    const prefix = `BKS-${year}-`;
    let maxSeq = 0;

    // 1. Scan store quotes for the specified year
    if (this.store.quotes && Array.isArray(this.store.quotes)) {
      for (const q of this.store.quotes) {
        if (q.id && q.id.startsWith(prefix)) {
          const numPart = parseInt(q.id.replace(prefix, ''), 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
            maxSeq = numPart;
          }
        }
      }
    }

    // 2. Scan PostgreSQL if connected
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 'BKS-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) as max_seq
           FROM quotes WHERE id LIKE $1`,
          [`BKS-${year}-%`]
        );
        if (res.rows.length > 0 && res.rows[0].max_seq) {
          const dbMax = parseInt(res.rows[0].max_seq, 10);
          if (!isNaN(dbMax) && dbMax > maxSeq) {
            maxSeq = dbMax;
          }
        }
      } catch (err) {
        console.warn('⚠️ [PostgreSQL] getNextQuoteSequence lookup warning:', err);
      }
    }

    return maxSeq + 1;
  }

  public async generateNextQuoteId(year: number = new Date().getFullYear()): Promise<string> {
    const nextSeq = await this.getNextQuoteSequence(year);
    return `BKS-${year}-${String(nextSeq).padStart(5, '0')}`;
  }

  getAllQuotes(status?: QuoteStatus): SubmittedQuote[] {
    let quotes = [...(this.store.quotes || [])];
    if (status) {
      const norm = normalizeQuoteStatus(status);
      quotes = quotes.filter((q) => q.status === norm);
    }
    return quotes.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  getQuoteById(id: string): SubmittedQuote | null {
    return (this.store.quotes || []).find((q) => q.id === id) || null;
  }

  async createQuote(quoteData: Omit<SubmittedQuote, 'id' | 'submittedAt' | 'status'> & { id?: string; status?: QuoteStatus }): Promise<SubmittedQuote> {
    const unlock = await this.quoteLock.lock();
    try {
      const currentYear = new Date().getFullYear();
      let id = quoteData.id;
      if (!id) {
        id = await this.generateNextQuoteId(currentYear);
      }

      const now = new Date().toISOString();
      const initialStatus = normalizeQuoteStatus(quoteData.status || 'NOUVEAU');

      const newQuote: SubmittedQuote = {
        ...quoteData,
        id,
        submittedAt: now,
        status: initialStatus,
        statusHistory: [
          {
            status: initialStatus,
            changedAt: now,
            note: 'Nouvelle demande de devis enregistrée',
          },
        ],
      };

      if (!this.store.quotes) this.store.quotes = [];
      this.store.quotes = this.store.quotes.filter((q) => q.id !== newQuote.id);
      this.store.quotes.unshift(newQuote);

      if (pgManager.isPgConnected()) {
        try {
          await pgManager.query(
            `INSERT INTO quotes (
               id, nom, prenom, nom_complet, entreprise, telephone, email, ville,
               type_prestation, produit, quantite, format, support_papier, grammage,
               impression_type, finition, delai, livraison_option, graphisme_option,
               description, estimated_price, price_type, status, admin_notes, status_history, files, submitted_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
             ON CONFLICT (id) DO UPDATE SET
               status = EXCLUDED.status,
               admin_notes = EXCLUDED.admin_notes,
               status_history = EXCLUDED.status_history,
               updated_at = NOW()`,
            [
              newQuote.id,
              newQuote.nom,
              newQuote.prenom || '',
              newQuote.nomComplet || `${newQuote.prenom || ''} ${newQuote.nom}`.trim() || newQuote.nom,
              newQuote.entreprise || 'Particulier',
              newQuote.telephone,
              newQuote.email || '',
              newQuote.ville || 'Ngaoundéré',
              newQuote.typePrestation,
              newQuote.produit || null,
              newQuote.quantite || 1,
              newQuote.format || 'Standard',
              newQuote.supportPapier || null,
              newQuote.grammage || null,
              newQuote.impressionType || 'Recto seul',
              newQuote.finition || 'Standard',
              newQuote.delai || 'Standard (3-5 jours)',
              newQuote.livraisonOption || 'Retrait en agence (Ngaoundéré)',
              newQuote.graphismeOption || 'Fichier prêt fourni (HD)',
              newQuote.description || null,
              newQuote.estimatedPrice || 0,
              newQuote.priceType || 'STARTING_AT',
              newQuote.status,
              newQuote.adminNotes || null,
              JSON.stringify(newQuote.statusHistory),
              JSON.stringify(newQuote.files || []),
              now,
            ]
          );
        } catch (err) {
          console.warn('⚠️ [PostgreSQL] createQuote query warning:', err);
        }
      }

      this.persist();
      return newQuote;
    } finally {
      unlock();
    }
  }

  updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    adminNotes?: string,
    finalPrice?: number,
    historyNote?: string
  ): SubmittedQuote | null {
    const quote = this.getQuoteById(id);
    if (!quote) return null;

    const normStatus = normalizeQuoteStatus(status);
    quote.status = normStatus;
    if (adminNotes !== undefined) quote.adminNotes = adminNotes;
    if (finalPrice !== undefined) quote.finalPrice = finalPrice;

    if (!quote.statusHistory) quote.statusHistory = [];
    quote.statusHistory.push({
      status: normStatus,
      changedAt: new Date().toISOString(),
      note: historyNote || `Statut passé à : ${normStatus}`,
    });

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `UPDATE quotes SET
           status = $1,
           admin_notes = COALESCE($2, admin_notes),
           final_price = COALESCE($3, final_price),
           status_history = $4,
           updated_at = NOW()
         WHERE id = $5`,
        [normStatus, adminNotes ?? null, finalPrice ?? null, JSON.stringify(quote.statusHistory), id]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] updateQuoteStatus error:', err));
    }

    this.persist();
    return quote;
  }

  updateQuote(
    id: string,
    updates: Partial<SubmittedQuote>,
    changedBy?: string
  ): SubmittedQuote | null {
    const quote = this.getQuoteById(id);
    if (!quote) return null;

    if (updates.status) {
      const normStatus = normalizeQuoteStatus(updates.status);
      updates.status = normStatus;
      if (!quote.statusHistory) quote.statusHistory = [];
      quote.statusHistory.push({
        status: normStatus,
        changedAt: new Date().toISOString(),
        changedBy,
        note: `Statut modifié par ${changedBy || 'Admin'} : ${normStatus}`,
      });
    }

    Object.assign(quote, updates);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `UPDATE quotes SET
           status = COALESCE($1, status),
           admin_notes = COALESCE($2, admin_notes),
           final_price = COALESCE($3, final_price),
           estimated_price = COALESCE($4, estimated_price),
           description = COALESCE($5, description),
           status_history = COALESCE($6, status_history),
           updated_at = NOW()
         WHERE id = $7`,
        [
          quote.status,
          quote.adminNotes ?? null,
          quote.finalPrice ?? null,
          quote.estimatedPrice ?? null,
          quote.description ?? null,
          JSON.stringify(quote.statusHistory),
          id,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] updateQuote error:', err));
    }

    this.persist();
    return quote;
  }

  deleteQuote(id: string): boolean {
    if (!this.store.quotes) return false;
    const initialLen = this.store.quotes.length;
    this.store.quotes = this.store.quotes.filter((q) => q.id !== id);
    if (this.store.quotes.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query('DELETE FROM quotes WHERE id = $1', [id]).catch((err) =>
          console.warn('⚠️ [PostgreSQL] deleteQuote error:', err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  // ================= PORTFOLIO =================
  getAllPortfolio(category?: string, includeInactive = false): PortfolioItem[] {
    let list = [...(this.store.portfolio || [])];

    if (!includeInactive) {
      list = list.filter((p) => p.active !== false);
    }

    if (category && category !== 'Tous' && category !== 'All') {
      const catLower = category.toLowerCase().trim();
      list = list.filter((p) => {
        const directCat = (p.category || '').toLowerCase().trim();
        const hasInCategories = Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().trim() === catLower);
        return directCat === catLower || hasInCategories;
      });
    }

    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  getPortfolioById(id: string): PortfolioItem | null {
    return (this.store.portfolio || []).find((p) => p.id === id) || null;
  }

  createPortfolioItem(itemData: Omit<PortfolioItem, 'id' | 'createdAt'> & { id?: string }): PortfolioItem {
    const id = itemData.id || `port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newItem: PortfolioItem = {
      ...itemData,
      id,
      categories: itemData.categories || [itemData.category],
      images: itemData.images || [itemData.image],
      tags: itemData.tags || [],
      featured: Boolean(itemData.featured),
      active: itemData.active !== undefined ? itemData.active : true,
      isDemo: Boolean(itemData.isDemo),
      createdAt: now,
      updatedAt: now,
    };

    if (!this.store.portfolio) this.store.portfolio = [];
    this.store.portfolio.unshift(newItem);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO portfolio (
           id, title, category, categories, description, image_url, images,
           client, year, tags, service_associe, service_id, featured, active, is_demo, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           active = EXCLUDED.active,
           featured = EXCLUDED.featured,
           is_demo = EXCLUDED.is_demo,
           updated_at = NOW()`,
        [
          newItem.id,
          newItem.title,
          newItem.category,
          JSON.stringify(newItem.categories),
          newItem.description,
          newItem.image,
          JSON.stringify(newItem.images),
          newItem.client || null,
          newItem.year || null,
          JSON.stringify(newItem.tags),
          newItem.serviceAssocie || null,
          newItem.serviceId || null,
          newItem.featured,
          newItem.active,
          newItem.isDemo,
          now,
          now,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] createPortfolioItem error:', err));
    }

    this.persist();
    return newItem;
  }

  updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): PortfolioItem | null {
    const item = this.getPortfolioById(id);
    if (!item) return null;

    updates.updatedAt = new Date().toISOString();
    Object.assign(item, updates);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `UPDATE portfolio SET
           title = COALESCE($1, title),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           client = COALESCE($5, client),
           year = COALESCE($6, year),
           service_associe = COALESCE($7, service_associe),
           service_id = COALESCE($8, service_id),
           featured = COALESCE($9, featured),
           active = COALESCE($10, active),
           is_demo = COALESCE($11, is_demo),
           updated_at = NOW()
         WHERE id = $12`,
        [
          updates.title ?? null,
          updates.category ?? null,
          updates.description ?? null,
          updates.image ?? null,
          updates.client ?? null,
          updates.year ?? null,
          updates.serviceAssocie ?? null,
          updates.serviceId ?? null,
          updates.featured ?? null,
          updates.active ?? null,
          updates.isDemo ?? null,
          id,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] updatePortfolioItem error:', err));
    }

    this.persist();
    return item;
  }

  togglePortfolioItem(id: string, explicitActive?: boolean): PortfolioItem | null {
    const item = this.getPortfolioById(id);
    if (!item) return null;

    item.active = explicitActive !== undefined ? explicitActive : item.active === false ? true : false;
    item.updatedAt = new Date().toISOString();

    if (pgManager.isPgConnected()) {
      pgManager.query('UPDATE portfolio SET active = $1, updated_at = NOW() WHERE id = $2', [item.active, id]).catch((err) =>
        console.warn('⚠️ [PostgreSQL] togglePortfolioItem error:', err)
      );
    }

    this.persist();
    return item;
  }

  deletePortfolioItem(id: string): boolean {
    if (!this.store.portfolio) return false;
    const initialLen = this.store.portfolio.length;
    this.store.portfolio = this.store.portfolio.filter((p) => p.id !== id);
    if (this.store.portfolio.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query('DELETE FROM portfolio WHERE id = $1', [id]).catch((err) =>
          console.warn('⚠️ [PostgreSQL] deletePortfolioItem error:', err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  // ================= MESSAGES =================
  getAllMessages(unreadOnly = false): ContactMessage[] {
    let list = [...(this.store.messages || [])];
    if (unreadOnly) {
      list = list.filter((m) => !m.read);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getMessageById(id: string): ContactMessage | null {
    return (this.store.messages || []).find((m) => m.id === id) || null;
  }

  createMessage(messageData: Omit<ContactMessage, 'id' | 'createdAt' | 'read'> & { id?: string }): ContactMessage {
    const id = messageData.id || `MSG-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newMsg: ContactMessage = {
      ...messageData,
      id,
      read: false,
      createdAt: now,
    };

    if (!this.store.messages) this.store.messages = [];
    this.store.messages.unshift(newMsg);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO messages (id, name, email_or_phone, subject, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newMsg.id, newMsg.name, newMsg.emailOrPhone, newMsg.subject || 'Demande', newMsg.message, false, now]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] createMessage error:', err));
    }

    this.persist();
    return newMsg;
  }

  markMessageAsRead(id: string, isRead = true): ContactMessage | null {
    const msg = this.getMessageById(id);
    if (!msg) return null;

    msg.read = isRead;
    if (pgManager.isPgConnected()) {
      pgManager.query('UPDATE messages SET is_read = $1 WHERE id = $2', [isRead, id]).catch((err) =>
        console.warn('⚠️ [PostgreSQL] markMessageAsRead error:', err)
      );
    }
    this.persist();
    return msg;
  }

  replyToMessage(id: string, reply: string): ContactMessage | null {
    const msg = this.getMessageById(id);
    if (!msg) return null;

    msg.adminReply = reply;
    msg.read = true;
    if (pgManager.isPgConnected()) {
      pgManager.query('UPDATE messages SET admin_reply = $1, is_read = true WHERE id = $2', [reply, id]).catch((err) =>
        console.warn('⚠️ [PostgreSQL] replyToMessage error:', err)
      );
    }
    this.persist();
    return msg;
  }

  updateMessage(id: string, updates: Partial<ContactMessage>): ContactMessage | null {
    const msg = this.getMessageById(id);
    if (!msg) return null;

    Object.assign(msg, updates);
    if (pgManager.isPgConnected()) {
      pgManager.query(
        `UPDATE messages SET
           is_read = COALESCE($1, is_read),
           admin_reply = COALESCE($2, admin_reply)
         WHERE id = $3`,
        [updates.read ?? null, updates.adminReply ?? null, id]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] updateMessage error:', err));
    }
    this.persist();
    return msg;
  }

  deleteMessage(id: string): boolean {
    if (!this.store.messages) return false;
    const initialLen = this.store.messages.length;
    this.store.messages = this.store.messages.filter((m) => m.id !== id);
    if (this.store.messages.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query('DELETE FROM messages WHERE id = $1', [id]).catch((err) =>
          console.warn('⚠️ [PostgreSQL] deleteMessage error:', err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  // ================= STATS =================
  getStats() {
    const quotes = this.store.quotes || [];
    const messages = this.store.messages || [];
    const portfolio = this.store.portfolio || [];

    const totalQuotes = quotes.length;
    const newQuotes = quotes.filter((q) => q.status === 'NOUVEAU').length;
    const inAnalysis = quotes.filter((q) => q.status === 'EN_ANALYSE').length;
    const inPrep = quotes.filter((q) => q.status === 'DEVIS_EN_PREPARATION').length;
    const sent = quotes.filter((q) => q.status === 'DEVIS_ENVOYE').length;
    const waitingClient = quotes.filter((q) => q.status === 'EN_ATTENTE_CLIENT').length;
    const accepted = quotes.filter((q) => q.status === 'ACCEPTE').length;
    const inProduction = quotes.filter((q) => q.status === 'EN_PRODUCTION').length;
    const completed = quotes.filter((q) => q.status === 'TERMINE').length;
    const cancelled = quotes.filter((q) => q.status === 'ANNULE').length;
    const totalEstimatedRevenue = quotes.reduce((sum, q) => sum + (Number(q.estimatedPrice) || 0), 0);

    return {
      totalQuotes,
      newQuotes,
      inAnalysis,
      inPrep,
      sent,
      waitingClient,
      accepted,
      inProduction,
      completed,
      cancelled,
      totalEstimatedRevenue,
      messagesCount: messages.length,
      unreadMessages: messages.filter((m) => !m.read).length,
      portfolioCount: portfolio.length,
      servicesCount: (this.store.services || []).length,
      dbMode: pgManager.getMode(),
      isPostgres: pgManager.isPgConnected(),
    };
  }

  // ================= SERVICES =================
  getAllServices(activeOnly = false): ServiceItem[] {
    let list = [...(this.store.services || [])];
    if (activeOnly) {
      list = list.filter((s) => s.active !== false);
    }
    return list;
  }

  getServiceById(id: string): ServiceItem | null {
    return (this.store.services || []).find((s) => s.id === id) || null;
  }

  createService(serviceData: Omit<ServiceItem, 'id' | 'createdAt'> & { id?: string }): ServiceItem {
    const id = serviceData.id || `srv-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newService: ServiceItem = {
      ...serviceData,
      id,
      active: serviceData.active !== undefined ? serviceData.active : true,
      createdAt: now,
      updatedAt: now,
    };
    if (!this.store.services) this.store.services = [];
    this.store.services.push(newService);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO services (
           id, group_id, group_title, category, title, short_desc, full_desc,
           icon_name, image_url, price_starting_at, popular, active, features, sample_deliverables, quote_type_prestation, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           short_desc = EXCLUDED.short_desc,
           full_desc = EXCLUDED.full_desc,
           image_url = EXCLUDED.image_url,
           active = EXCLUDED.active,
           popular = EXCLUDED.popular,
           updated_at = NOW()`,
        [
          newService.id,
          newService.groupId || 'imprimerie',
          newService.groupTitle || 'Imprimerie',
          newService.category,
          newService.title,
          newService.shortDesc,
          newService.fullDesc,
          newService.iconName || 'Printer',
          newService.image,
          newService.priceStartingAt || 0,
          newService.popular || false,
          newService.active,
          JSON.stringify(newService.features || []),
          JSON.stringify(newService.sampleDeliverables || []),
          newService.quoteTypePrestation,
          now,
          now,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] createService error:', err));
    }

    this.persist();
    return newService;
  }

  updateService(id: string, updates: Partial<ServiceItem>): ServiceItem | null {
    const srv = this.getServiceById(id);
    if (!srv) return null;

    updates.updatedAt = new Date().toISOString();
    Object.assign(srv, updates);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `UPDATE services SET
           title = COALESCE($1, title),
           category = COALESCE($2, category),
           short_desc = COALESCE($3, short_desc),
           full_desc = COALESCE($4, full_desc),
           image_url = COALESCE($5, image_url),
           price_starting_at = COALESCE($6, price_starting_at),
           popular = COALESCE($7, popular),
           active = COALESCE($8, active),
           updated_at = NOW()
         WHERE id = $9`,
        [
          updates.title ?? null,
          updates.category ?? null,
          updates.shortDesc ?? null,
          updates.fullDesc ?? null,
          updates.image ?? null,
          updates.priceStartingAt ?? null,
          updates.popular ?? null,
          updates.active ?? null,
          id,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] updateService error:', err));
    }

    this.persist();
    return srv;
  }

  deleteService(id: string): boolean {
    if (!this.store.services) return false;
    const initialLen = this.store.services.length;
    this.store.services = this.store.services.filter((s) => s.id !== id);
    if (this.store.services.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query('DELETE FROM services WHERE id = $1', [id]).catch((err) =>
          console.warn('⚠️ [PostgreSQL] deleteService error:', err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  // ================= PRICE CATEGORIES =================
  getAllPriceCategories(): PriceCategory[] {
    return [...(this.store.priceCategories || [])];
  }

  getPriceCategoryById(id: string): PriceCategory | null {
    return (this.store.priceCategories || []).find((c) => c.id === id) || null;
  }

  savePriceCategoryItem(categoryId: string, item: PriceGridItem): PriceGridItem | null {
    let cat = (this.store.priceCategories || []).find((c) => c.id === categoryId);
    if (!cat) {
      cat = {
        id: categoryId,
        name: categoryId,
        iconName: 'Layers',
        description: '',
        items: [],
      };
      if (!this.store.priceCategories) this.store.priceCategories = [];
      this.store.priceCategories.push(cat);

      if (pgManager.isPgConnected()) {
        pgManager.query(
          `INSERT INTO price_categories (id, name, icon_name, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [cat.id, cat.name, cat.iconName, cat.description]
        ).catch((err) => console.warn('⚠️ [PostgreSQL] savePriceCategory error:', err));
      }
    }

    if (!cat.items) cat.items = [];
    const existingIndex = cat.items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      cat.items[existingIndex] = { ...cat.items[existingIndex], ...item };
    } else {
      cat.items.push(item);
    }

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO prices (
           id, category_id, name, category, format, specs, unit_price, unit, popular, active, min_qty
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           unit_price = EXCLUDED.unit_price,
           popular = EXCLUDED.popular,
           active = EXCLUDED.active,
           updated_at = NOW()`,
        [
          item.id,
          categoryId,
          item.name,
          item.category || cat.name,
          item.format || null,
          item.specs || null,
          item.unitPrice || 0,
          item.unit || 'FCFA',
          item.popular || false,
          item.active !== false,
          item.minQty || 1,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] savePriceItem error:', err));
    }

    this.persist();
    return item;
  }

  deletePriceCategoryItem(categoryId: string, itemId: string): boolean {
    const cat = (this.store.priceCategories || []).find((c) => c.id === categoryId);
    if (!cat || !cat.items) return false;

    const initialLen = cat.items.length;
    cat.items = cat.items.filter((i) => i.id !== itemId);
    if (cat.items.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query('DELETE FROM prices WHERE id = $1', [itemId]).catch((err) =>
          console.warn('⚠️ [PostgreSQL] deletePriceItem error:', err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  togglePriceCategoryItem(categoryId: string, itemId: string): PriceGridItem | null {
    const cat = (this.store.priceCategories || []).find((c) => c.id === categoryId);
    if (!cat || !cat.items) return null;

    const item = cat.items.find((i) => i.id === itemId);
    if (!item) return null;

    item.active = item.active === false ? true : false;

    if (pgManager.isPgConnected()) {
      pgManager.query('UPDATE prices SET active = $1, updated_at = NOW() WHERE id = $2', [item.active, itemId]).catch((err) =>
        console.warn('⚠️ [PostgreSQL] togglePriceCategoryItem error:', err)
      );
    }

    this.persist();
    return item;
  }

  // ================= TESTIMONIALS =================
  getAllTestimonials(): Testimonial[] {
    return [...(this.store.testimonials || [])];
  }

  createTestimonial(testimonialData: Omit<Testimonial, 'id' | 'createdAt'> & { id?: string }): Testimonial {
    const id = testimonialData.id || `tst-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newTestimonial: Testimonial = {
      ...testimonialData,
      id,
      createdAt: now,
    };
    if (!this.store.testimonials) this.store.testimonials = [];
    this.store.testimonials.unshift(newTestimonial);

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO testimonials (id, author, role, company, avatar_url, comment, rating, date_label, project, is_approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newTestimonial.id,
          newTestimonial.author,
          newTestimonial.role,
          newTestimonial.company,
          newTestimonial.avatar,
          newTestimonial.comment,
          newTestimonial.rating || 5,
          newTestimonial.date || '2026',
          newTestimonial.project || null,
          true,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] createTestimonial error:', err));
    }

    this.persist();
    return newTestimonial;
  }

  // ================= AUDIT LOGS =================
  getAllAuditLogs(filter?: {
    resource?: string;
    action?: string;
    role?: string;
    username?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditLog[] {
    let list = [...(this.store.auditLogs || [])];

    if (filter) {
      if (filter.resource && filter.resource !== 'ALL') {
        const resUpper = filter.resource.toUpperCase();
        list = list.filter((l) => l.resource.toUpperCase() === resUpper);
      }
      if (filter.action && filter.action !== 'ALL') {
        const actUpper = filter.action.toUpperCase();
        list = list.filter((l) => l.action.toUpperCase() === actUpper);
      }
      if (filter.role && filter.role !== 'ALL') {
        const roleUpper = filter.role.toUpperCase();
        list = list.filter((l) => l.role.toUpperCase() === roleUpper);
      }
      if (filter.username) {
        const uLower = filter.username.toLowerCase();
        list = list.filter((l) => l.username.toLowerCase().includes(uLower));
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (l) =>
            l.description.toLowerCase().includes(q) ||
            l.username.toLowerCase().includes(q) ||
            (l.userFullName && l.userFullName.toLowerCase().includes(q)) ||
            (l.resourceTitle && l.resourceTitle.toLowerCase().includes(q)) ||
            l.resourceId.toLowerCase().includes(q)
        );
      }
      if (filter.startDate) {
        const start = new Date(filter.startDate).getTime();
        list = list.filter((l) => new Date(l.createdAt).getTime() >= start);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate).getTime();
        list = list.filter((l) => new Date(l.createdAt).getTime() <= end);
      }
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter?.limit && filter.limit > 0) {
      list = list.slice(0, filter.limit);
    }

    return list;
  }

  getAuditLogById(id: string): AuditLog | null {
    return (this.store.auditLogs || []).find((l) => l.id === id) || null;
  }

  createAuditLog(logData: Omit<AuditLog, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AuditLog {
    const id = logData.id || `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = logData.createdAt || new Date().toISOString();

    const newLog: AuditLog = {
      ...logData,
      id,
      createdAt: now,
    };

    if (!this.store.auditLogs) this.store.auditLogs = [];
    this.store.auditLogs.unshift(newLog);

    // Keep memory cache within reasonable size
    if (this.store.auditLogs.length > 1000) {
      this.store.auditLogs = this.store.auditLogs.slice(0, 1000);
    }

    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO audit_logs (
           id, user_id, username, user_full_name, role, action,
           resource, resource_id, resource_title, description, old_value, new_value, ip_address, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newLog.id,
          newLog.userId || null,
          newLog.username,
          newLog.userFullName || null,
          newLog.role,
          newLog.action,
          newLog.resource,
          newLog.resourceId,
          newLog.resourceTitle || null,
          newLog.description,
          newLog.oldValue ? JSON.stringify(newLog.oldValue) : null,
          newLog.newValue ? JSON.stringify(newLog.newValue) : null,
          newLog.ipAddress || null,
          now,
        ]
      ).catch((err) => console.warn('⚠️ [PostgreSQL] createAuditLog error:', err));
    }

    this.persist();
    return newLog;
  }

  getAuditStats() {
    const logs = this.store.auditLogs || [];
    const totalLogs = logs.length;
    const byRole: Record<string, number> = { ADMIN: 0, EDITOR: 0, SYSTEM: 0 };
    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let recentLogsCount = 0;

    for (const log of logs) {
      const role = log.role || 'UNKNOWN';
      byRole[role] = (byRole[role] || 0) + 1;

      const action = log.action || 'UNKNOWN';
      byAction[action] = (byAction[action] || 0) + 1;

      const resource = log.resource || 'UNKNOWN';
      byResource[resource] = (byResource[resource] || 0) + 1;

      if (new Date(log.createdAt).getTime() >= oneDayAgo) {
        recentLogsCount++;
      }
    }

    return {
      totalLogs,
      byRole,
      byAction,
      byResource,
      recentLogsCount,
    };
  }
}

export const db = new Database();
