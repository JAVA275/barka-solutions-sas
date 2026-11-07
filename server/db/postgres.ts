import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DbConfig {
  connectionString?: string;
  isAvailable: boolean;
  mode: 'POSTGRESQL' | 'FALLBACK_LOCAL';
}

class PostgresManager {
  private pool: pg.Pool | null = null;
  private isConnected: boolean = false;
  private mode: 'POSTGRESQL' | 'FALLBACK_LOCAL' = 'FALLBACK_LOCAL';

  constructor() {
    this.initPool();
  }

  private cleanConnectionString(url?: string): string | undefined {
    if (!url) return undefined;
    let clean = url.trim();
    if (clean.startsWith('DATABASE_URL=')) {
      clean = clean.replace('DATABASE_URL=', '').trim();
    }
    // Check if it's still a placeholder like postgresql://utilisateur:motdepasse...
    if (clean.includes('utilisateur:motdepasse') || clean.includes('nom_de_la_base')) {
      return undefined;
    }
    return clean;
  }

  private initPool() {
    const connStr = this.cleanConnectionString(process.env.DATABASE_URL);
    if (connStr) {
      const isSslNeeded = connStr.includes('sslmode=require') || !connStr.includes('localhost');
      this.pool = new Pool({
        connectionString: connStr,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err) => {
        console.warn('⚠️ [PostgreSQL Pool] Erreur de connexion:', err.message);
      });
    }
  }

  public async checkConnection(): Promise<boolean> {
    if (!this.pool) {
      this.isConnected = false;
      this.mode = 'FALLBACK_LOCAL';
      return false;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isConnected = true;
      this.mode = 'POSTGRESQL';
      console.log('✅ [PostgreSQL] Connexion réussie à la base de données PostgreSQL.');
      return true;
    } catch (err: any) {
      console.warn('ℹ️ [PostgreSQL] Serveur PostgreSQL externe non joignable (mode mémoire/local actif) :', err.message);
      this.isConnected = false;
      this.mode = 'FALLBACK_LOCAL';
      return false;
    }
  }

  public getMode(): 'POSTGRESQL' | 'FALLBACK_LOCAL' {
    return this.mode;
  }

  public isPgConnected(): boolean {
    return this.isConnected;
  }

  public async query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL non connecté');
    }
    return this.pool.query<T>(text, params);
  }

  public async runMigrations(): Promise<void> {
    if (!this.isConnected || !this.pool) {
      return;
    }

    try {
      console.log('🔄 [PostgreSQL] Exécution des migrations du schéma...');
      const schemaPath = path.resolve(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        await this.pool.query(sql);
        console.log('✅ [PostgreSQL] Schéma et tables PostgreSQL synchronisés avec succès.');
      }
    } catch (err: any) {
      console.error('❌ [PostgreSQL] Erreur lors de l’exécution du schéma SQL :', err.message);
    }
  }

  public async seedFromStoreIfEmpty(): Promise<void> {
    if (!this.isConnected || !this.pool) {
      return;
    }

    try {
      // Check if users table is empty
      const userCheck = await this.pool.query('SELECT COUNT(*) as count FROM users');
      const count = parseInt(userCheck.rows[0]?.count || '0', 10);

      if (count > 0) {
        console.log('ℹ️ [PostgreSQL] Les données existent déjà dans PostgreSQL, aucun seed requis.');
        return;
      }

      console.log('🌱 [PostgreSQL] Initialisation / Migration des données depuis store.json vers PostgreSQL...');
      const storePath = path.resolve(__dirname, '../data/store.json');
      if (!fs.existsSync(storePath)) {
        return;
      }

      const raw = fs.readFileSync(storePath, 'utf-8');
      const store = JSON.parse(raw);

      // Helper function to map quote statuses to official enum
      const normalizeStatus = (status: string): string => {
        const mapping: Record<string, string> = {
          'Nouveau': 'NOUVEAU',
          'En cours': 'EN_PRODUCTION',
          'Traité': 'TERMINE',
          'Archivé': 'TERMINE',
          'Annulé': 'ANNULE',
        };
        return mapping[status] || status || 'NOUVEAU';
      };

      // 1. Seed Users
      if (Array.isArray(store.users)) {
        for (const u of store.users) {
          await this.pool.query(
            `INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (username) DO NOTHING`,
            [
              u.id,
              u.username,
              u.email,
              u.passwordHash,
              u.fullName,
              u.role || 'EDITOR',
              u.isActive !== false,
              u.createdAt || new Date(),
              u.updatedAt || new Date(),
            ]
          );
        }
      }

      // 2. Seed Company Settings
      if (store.companySettings) {
        const cs = store.companySettings;
        await this.pool.query(
          `INSERT INTO company_settings (
             company_name, legal_name, tagline, slogan, address, city, country,
             phone_primary, phone_secondary, whatsapp, whatsapp_raw, email_primary, email_secondary,
             website, logo_url, opening_hours, social_links
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            cs.company_name,
            cs.legal_name,
            cs.tagline,
            cs.slogan,
            cs.address,
            cs.city,
            cs.country,
            cs.phone_primary,
            cs.phone_secondary,
            cs.whatsapp,
            cs.whatsapp_raw || '237696311198',
            cs.email_primary,
            cs.email_secondary,
            cs.website || '',
            cs.logo || '/assets/logo-barka.png',
            JSON.stringify(cs.opening_hours || {}),
            JSON.stringify(cs.social_links || {}),
          ]
        );
      }

      // 3. Seed Services
      if (Array.isArray(store.services)) {
        for (const s of store.services) {
          await this.pool.query(
            `INSERT INTO services (
               id, group_id, group_title, category, title, short_desc, full_desc,
               icon_name, image_url, price_starting_at, popular, active, features, sample_deliverables, quote_type_prestation
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [
              s.id,
              s.groupId || 'imprimerie',
              s.groupTitle || 'Imprimerie',
              s.category,
              s.title,
              s.shortDesc,
              s.fullDesc,
              s.iconName || 'Printer',
              s.image,
              s.priceStartingAt || 0,
              s.popular || false,
              s.active !== false,
              JSON.stringify(s.features || []),
              JSON.stringify(s.sampleDeliverables || []),
              s.quoteTypePrestation,
            ]
          );
        }
      }

      // 4. Seed Portfolio
      if (Array.isArray(store.portfolio)) {
        for (const p of store.portfolio) {
          await this.pool.query(
            `INSERT INTO portfolio (
               id, title, category, categories, description, image_url, images,
               client, year, tags, service_associe, service_id, featured, active, is_demo, created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (id) DO NOTHING`,
            [
              p.id,
              p.title,
              p.category,
              JSON.stringify(p.categories || [p.category]),
              p.description,
              p.image,
              JSON.stringify(p.images || [p.image]),
              p.client,
              p.year,
              JSON.stringify(p.tags || []),
              p.serviceAssocie,
              p.serviceId,
              p.featured || false,
              p.active !== false,
              p.isDemo || false,
              p.createdAt || new Date(),
            ]
          );
        }
      }

      // 5. Seed Price Categories & Items
      if (Array.isArray(store.priceCategories)) {
        for (let i = 0; i < store.priceCategories.length; i++) {
          const pc = store.priceCategories[i];
          await this.pool.query(
            `INSERT INTO price_categories (id, name, icon_name, description, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [pc.id, pc.name, pc.iconName || 'BookOpen', pc.description, i]
          );

          if (Array.isArray(pc.items)) {
            for (let j = 0; j < pc.items.length; j++) {
              const item = pc.items[j];
              await this.pool.query(
                `INSERT INTO prices (
                   id, category_id, name, category, format, specs, unit_price, unit, popular, active, min_qty, sort_order
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  item.id,
                  pc.id,
                  item.name,
                  item.category || pc.name,
                  item.format || null,
                  item.specs || null,
                  item.unitPrice || 0,
                  item.unit || 'FCFA',
                  item.popular || false,
                  item.active !== false,
                  item.minQty || 1,
                  j,
                ]
              );
            }
          }
        }
      }

      // 6. Seed Quotes
      if (Array.isArray(store.quotes)) {
        for (const q of store.quotes) {
          const normStatus = normalizeStatus(q.status);
          const normHistory = Array.isArray(q.statusHistory)
            ? q.statusHistory.map((h: any) => ({ ...h, status: normalizeStatus(h.status) }))
            : [{ status: normStatus, changedAt: q.submittedAt || new Date().toISOString(), note: 'Initialisation' }];

          await this.pool.query(
            `INSERT INTO quotes (
               id, nom, prenom, nom_complet, entreprise, telephone, email, ville,
               type_prestation, produit, quantite, format, support_papier, grammage,
               impression_type, finition, delai, livraison_option, graphisme_option,
               description, estimated_price, price_type, status, admin_notes, status_history, files, submitted_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
             ON CONFLICT (id) DO NOTHING`,
            [
              q.id,
              q.nom,
              q.prenom || '',
              q.nomComplet || `${q.prenom || ''} ${q.nom}`.trim() || q.nom,
              q.entreprise || 'Particulier',
              q.telephone,
              q.email || '',
              q.ville || 'Ngaoundéré',
              q.typePrestation,
              q.produit || null,
              q.quantite || 1,
              q.format || 'Standard',
              q.supportPapier || null,
              q.grammage || null,
              q.impressionType || 'Recto seul',
              q.finition || 'Standard',
              q.delai || 'Standard (3-5 jours)',
              q.livraisonOption || 'Retrait en agence (Ngaoundéré)',
              q.graphismeOption || 'Fichier prêt fourni (HD)',
              q.description || null,
              q.estimatedPrice || 0,
              q.priceType || 'STARTING_AT',
              normStatus,
              q.adminNotes || null,
              JSON.stringify(normHistory),
              JSON.stringify(q.files || []),
              q.submittedAt || new Date(),
            ]
          );
        }
      }

      // 7. Seed Messages
      if (Array.isArray(store.messages)) {
        for (const m of store.messages) {
          await this.pool.query(
            `INSERT INTO messages (id, name, email_or_phone, subject, message, is_read, admin_reply, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            [
              m.id,
              m.name,
              m.emailOrPhone,
              m.subject || 'Demande de renseignement',
              m.message,
              m.read || false,
              m.adminReply || null,
              m.createdAt || new Date(),
            ]
          );
        }
      }

      // 8. Seed Testimonials
      if (Array.isArray(store.testimonials)) {
        for (const t of store.testimonials) {
          await this.pool.query(
            `INSERT INTO testimonials (id, author, role, company, avatar_url, comment, rating, date_label, project, is_approved)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [
              t.id,
              t.author,
              t.role,
              t.company,
              t.avatar,
              t.comment,
              t.rating || 5,
              t.date || '2026',
              t.project || null,
              true,
            ]
          );
        }
      }

      console.log('✅ [PostgreSQL] Migration et amorçage des données terminés avec succès.');
    } catch (err: any) {
      console.error('❌ [PostgreSQL] Erreur lors du seed des données :', err.message);
    }
  }
}

export const pgManager = new PostgresManager();
