// server/app.ts
import express from "express";
import cookieParser from "cookie-parser";

// server/middleware/securityHeaders.ts
function securityHeadersMiddleware(req, res, next) {
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=(), accelerometer=()"
  );
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: ws: wss:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
}

// server/middleware/csrfProtection.ts
var MUTATING_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
function csrfProtection(req, res, next) {
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    return next();
  }
  const cookieToken = req.cookies?.barka_auth_token || req.headers.cookie && req.headers.cookie.includes("barka_auth_token=");
  if (!cookieToken) {
    return next();
  }
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }
  const secFetchSite = req.headers["sec-fetch-site"];
  if (secFetchSite === "cross-site") {
    res.status(403).json({
      success: false,
      error: "Requ\xEAte cross-origin rejet\xE9e par la protection CSRF.",
      code: "CSRF_BLOCKED_CROSS_SITE"
    });
    return;
  }
  const xRequestedWith = req.headers["x-requested-with"];
  const csrfHeader = req.headers["x-csrf-token"];
  if (xRequestedWith === "XMLHttpRequest" || csrfHeader) {
    return next();
  }
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return next();
      }
    } catch {
    }
  }
  if (process.env.NODE_ENV !== "production" && !origin) {
    return next();
  }
  res.status(403).json({
    success: false,
    error: "\xC9chec de la validation CSRF. En-t\xEAte de protection manquant.",
    code: "CSRF_VALIDATION_FAILED"
  });
}

// server/middleware/errorHandler.ts
import multer from "multer";
import crypto from "crypto";
function globalErrorHandler(err, req, res, _next) {
  const traceId = req.traceId || crypto.randomUUID();
  if (err instanceof multer.MulterError) {
    let message = "Erreur lors du t\xE9l\xE9versement du fichier.";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Le fichier d\xE9passe la taille maximale autoris\xE9e (50 Mo pour devis, 10 Mo pour portfolio).";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Nombre maximum de fichiers autoris\xE9s d\xE9pass\xE9 (maximum 5 fichiers).";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Champ de fichier inattendu : "${err.field}".`;
    }
    res.status(400).json({
      success: false,
      error: message,
      code: err.code
    });
    return;
  }
  if (err.message && (err.message.includes("Format de fichier non autoris\xE9") || err.message.includes("Type MIME non autoris\xE9") || err.message.includes("Seules les images"))) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  console.error(`[API ERROR] [traceId=${traceId}] ${req.method} ${req.originalUrl} - Status: ${statusCode}`);
  console.error(err.stack || err);
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const clientMessage = statusCode === 500 ? "Une erreur interne est survenue. Veuillez r\xE9essayer ult\xE9rieurement." : err.message || "Requ\xEAte invalide.";
  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    traceId: statusCode === 500 ? traceId : void 0
  });
}

// server/services/fileManager.ts
import path3 from "path";
import fs3 from "fs";
import os2 from "os";
import crypto4 from "crypto";

// server/db/database.ts
import fs2 from "fs";
import path2 from "path";
import os from "os";
import crypto3 from "crypto";

// server/config/companySettings.ts
var DEFAULT_COMPANY_SETTINGS = {
  company_name: "BARKA SOLUTIONS S.A.S",
  legal_name: "BARKA SOLUTIONS Soci\xE9t\xE9 par Actions Simplifi\xE9e (S.A.S)",
  tagline: "Imprimerie & Multiservices",
  slogan: "L'excellence ma\xEEtris\xE9e",
  address: "Derri\xE8re le Restaurant Le Verger, Ngaound\xE9r\xE9, Cameroun",
  city: "Ngaound\xE9r\xE9",
  country: "Cameroun",
  phone_primary: "+237 696 311 198",
  phone_secondary: "+237 690 084 142",
  whatsapp: "+237 696 311 198",
  whatsapp_raw: "237696311198",
  email_primary: "kouchoumichel@yahoo.fr",
  email_secondary: "direction@barkasolutions.org",
  website: "",
  logo: "/assets/logo-barka.png",
  opening_hours: {
    weekday: "Lundi - Vendredi : 08h00 \u2013 18h00",
    saturday: "Samedi : 08h00 \u2013 13h00",
    sunday: "Ferm\xE9 (Permanence WhatsApp 24/7)"
  },
  social_links: {
    whatsapp: "https://wa.me/237696311198",
    email: "mailto:direction@barkasolutions.org"
  }
};

// server/services/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto2 from "crypto";

// server/db/postgres.ts
import pg from "pg";
import fs from "fs";
import path from "path";
var { Pool } = pg;
var PostgresManager = class {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.mode = "FALLBACK_LOCAL";
    this.initPool();
  }
  cleanConnectionString(url) {
    if (!url) return void 0;
    let clean = url.trim();
    if (clean.startsWith("DATABASE_URL=")) {
      clean = clean.replace("DATABASE_URL=", "").trim();
    }
    if (clean.includes("utilisateur:motdepasse") || clean.includes("nom_de_la_base")) {
      return void 0;
    }
    return clean;
  }
  initPool() {
    const connStr = this.cleanConnectionString(process.env.DATABASE_URL);
    if (connStr) {
      const isSslNeeded = connStr.includes("sslmode=require") || !connStr.includes("localhost");
      this.pool = new Pool({
        connectionString: connStr,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 3e4,
        connectionTimeoutMillis: 5e3
      });
      this.pool.on("error", (err) => {
        console.warn("\u26A0\uFE0F [PostgreSQL Pool] Erreur de connexion:", err.message);
      });
    }
  }
  async checkConnection() {
    if (!this.pool) {
      this.isConnected = false;
      this.mode = "FALLBACK_LOCAL";
      return false;
    }
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      this.isConnected = true;
      this.mode = "POSTGRESQL";
      console.log("\u2705 [PostgreSQL] Connexion r\xE9ussie \xE0 la base de donn\xE9es PostgreSQL.");
      return true;
    } catch (err) {
      console.warn("\u2139\uFE0F [PostgreSQL] Serveur PostgreSQL externe non joignable (mode m\xE9moire/local actif) :", err.message);
      this.isConnected = false;
      this.mode = "FALLBACK_LOCAL";
      return false;
    }
  }
  getMode() {
    return this.mode;
  }
  isPgConnected() {
    return this.isConnected;
  }
  async query(text, params) {
    if (!this.pool || !this.isConnected) {
      throw new Error("PostgreSQL non connect\xE9");
    }
    return this.pool.query(text, params);
  }
  async runMigrations() {
    if (!this.isConnected || !this.pool) {
      return;
    }
    try {
      console.log("\u{1F504} [PostgreSQL] Ex\xE9cution des migrations du sch\xE9ma...");
      const candidatePaths = [
        path.resolve(process.cwd(), "server", "db", "schema.sql"),
        path.resolve(process.cwd(), "schema.sql")
      ];
      const schemaPath = candidatePaths.find((p) => fs.existsSync(p));
      if (schemaPath) {
        const sql = fs.readFileSync(schemaPath, "utf-8");
        await this.pool.query(sql);
        console.log("\u2705 [PostgreSQL] Sch\xE9ma et tables PostgreSQL synchronis\xE9s avec succ\xE8s.");
      }
    } catch (err) {
      console.error("\u274C [PostgreSQL] Erreur lors de l\u2019ex\xE9cution du sch\xE9ma SQL :", err.message);
    }
  }
  async seedFromStoreIfEmpty() {
    if (!this.isConnected || !this.pool) {
      return;
    }
    try {
      const userCheck = await this.pool.query("SELECT COUNT(*) as count FROM users");
      const count = parseInt(userCheck.rows[0]?.count || "0", 10);
      if (count > 0) {
        console.log("\u2139\uFE0F [PostgreSQL] Les donn\xE9es existent d\xE9j\xE0 dans PostgreSQL, aucun seed requis.");
        return;
      }
      console.log("\u{1F331} [PostgreSQL] Initialisation / Migration des donn\xE9es depuis store.json vers PostgreSQL...");
      const candidateStorePaths = [
        path.resolve(process.cwd(), "server", "data", "store.json"),
        path.resolve(process.cwd(), "data", "store.json")
      ];
      const storePath = candidateStorePaths.find((p) => fs.existsSync(p));
      if (!storePath) {
        return;
      }
      const raw = fs.readFileSync(storePath, "utf-8");
      const store = JSON.parse(raw);
      const normalizeStatus = (status) => {
        const mapping = {
          "Nouveau": "NOUVEAU",
          "En cours": "EN_PRODUCTION",
          "Trait\xE9": "TERMINE",
          "Archiv\xE9": "TERMINE",
          "Annul\xE9": "ANNULE"
        };
        return mapping[status] || status || "NOUVEAU";
      };
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
              u.role || "EDITOR",
              u.isActive !== false,
              u.createdAt || /* @__PURE__ */ new Date(),
              u.updatedAt || /* @__PURE__ */ new Date()
            ]
          );
        }
      }
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
            cs.whatsapp_raw || "237696311198",
            cs.email_primary,
            cs.email_secondary,
            cs.website || "",
            cs.logo || "/assets/logo-barka.png",
            JSON.stringify(cs.opening_hours || {}),
            JSON.stringify(cs.social_links || {})
          ]
        );
      }
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
              s.groupId || "imprimerie",
              s.groupTitle || "Imprimerie",
              s.category,
              s.title,
              s.shortDesc,
              s.fullDesc,
              s.iconName || "Printer",
              s.image,
              s.priceStartingAt || 0,
              s.popular || false,
              s.active !== false,
              JSON.stringify(s.features || []),
              JSON.stringify(s.sampleDeliverables || []),
              s.quoteTypePrestation
            ]
          );
        }
      }
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
              p.createdAt || /* @__PURE__ */ new Date()
            ]
          );
        }
      }
      if (Array.isArray(store.priceCategories)) {
        for (let i = 0; i < store.priceCategories.length; i++) {
          const pc = store.priceCategories[i];
          await this.pool.query(
            `INSERT INTO price_categories (id, name, icon_name, description, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [pc.id, pc.name, pc.iconName || "BookOpen", pc.description, i]
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
                  item.unit || "FCFA",
                  item.popular || false,
                  item.active !== false,
                  item.minQty || 1,
                  j
                ]
              );
            }
          }
        }
      }
      if (Array.isArray(store.quotes)) {
        for (const q of store.quotes) {
          const normStatus = normalizeStatus(q.status);
          const normHistory = Array.isArray(q.statusHistory) ? q.statusHistory.map((h) => ({ ...h, status: normalizeStatus(h.status) })) : [{ status: normStatus, changedAt: q.submittedAt || (/* @__PURE__ */ new Date()).toISOString(), note: "Initialisation" }];
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
              q.prenom || "",
              q.nomComplet || `${q.prenom || ""} ${q.nom}`.trim() || q.nom,
              q.entreprise || "Particulier",
              q.telephone,
              q.email || "",
              q.ville || "Ngaound\xE9r\xE9",
              q.typePrestation,
              q.produit || null,
              q.quantite || 1,
              q.format || "Standard",
              q.supportPapier || null,
              q.grammage || null,
              q.impressionType || "Recto seul",
              q.finition || "Standard",
              q.delai || "Standard (3-5 jours)",
              q.livraisonOption || "Retrait en agence (Ngaound\xE9r\xE9)",
              q.graphismeOption || "Fichier pr\xEAt fourni (HD)",
              q.description || null,
              q.estimatedPrice || 0,
              q.priceType || "STARTING_AT",
              normStatus,
              q.adminNotes || null,
              JSON.stringify(normHistory),
              JSON.stringify(q.files || []),
              q.submittedAt || /* @__PURE__ */ new Date()
            ]
          );
        }
      }
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
              m.subject || "Demande de renseignement",
              m.message,
              m.read || false,
              m.adminReply || null,
              m.createdAt || /* @__PURE__ */ new Date()
            ]
          );
        }
      }
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
              t.date || "2026",
              t.project || null,
              true
            ]
          );
        }
      }
      console.log("\u2705 [PostgreSQL] Migration et amor\xE7age des donn\xE9es termin\xE9s avec succ\xE8s.");
    } catch (err) {
      console.error("\u274C [PostgreSQL] Erreur lors du seed des donn\xE9es :", err.message);
    }
  }
};
var pgManager = new PostgresManager();

// server/services/auth.ts
var cachedJwtSecret = null;
function getJwtSecret() {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }
  const envSecret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    if (!envSecret) {
      throw new Error(
        "\u{1F6A8} [SECURITY FATAL ERROR] JWT_SECRET environment variable is MANDATORY in production mode. Server startup aborted."
      );
    }
    if (envSecret.length < 32) {
      throw new Error(
        "\u{1F6A8} [SECURITY FATAL ERROR] JWT_SECRET must be at least 32 characters long in production mode. Server startup aborted."
      );
    }
    cachedJwtSecret = envSecret;
    return cachedJwtSecret;
  }
  if (envSecret && envSecret.length >= 16) {
    cachedJwtSecret = envSecret;
  } else {
    const generated = crypto2.randomBytes(32).toString("hex");
    cachedJwtSecret = generated;
    console.warn(
      "\u26A0\uFE0F [SECURITY WARNING] JWT_SECRET non d\xE9fini ou trop court en mode d\xE9veloppement. Une cl\xE9 cryptographique s\xE9curis\xE9e de session a \xE9t\xE9 g\xE9n\xE9r\xE9e automatiquement."
    );
  }
  return cachedJwtSecret;
}
function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "8h";
}
var tokenBlacklist = /* @__PURE__ */ new Map();
function hashToken(token) {
  return crypto2.createHash("sha256").update(token.trim()).digest("hex");
}
var cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [hash, entry] of tokenBlacklist.entries()) {
    if (now > entry.expiresAtMs) {
      tokenBlacklist.delete(hash);
    }
  }
}, 15 * 60 * 1e3);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}
async function revokeToken(token, userId, reason = "LOGOUT") {
  if (!token) return;
  const tokenHash = hashToken(token);
  let expiresAtMs = Date.now() + 24 * 3600 * 1e3;
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      expiresAtMs = decoded.exp * 1e3;
    }
    if (!userId && (decoded?.id || decoded?.userId)) {
      userId = decoded.id || decoded.userId;
    }
  } catch {
  }
  tokenBlacklist.set(tokenHash, { expiresAtMs });
  if (pgManager.isPgConnected()) {
    try {
      const expiresAt = new Date(expiresAtMs);
      await pgManager.query(
        `INSERT INTO revoked_tokens (token_hash, user_id, expires_at, reason)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, userId || null, expiresAt, reason]
      );
    } catch (err) {
      console.warn("\u26A0\uFE0F [Auth] Erreur persistance r\xE9vocation token dans PostgreSQL:", err.message);
    }
  }
}
function isTokenRevoked(token) {
  if (!token) return true;
  const tokenHash = hashToken(token);
  return tokenBlacklist.has(tokenHash);
}
async function isTokenRevokedAsync(token) {
  if (!token) return true;
  const tokenHash = hashToken(token);
  if (tokenBlacklist.has(tokenHash)) {
    return true;
  }
  if (pgManager.isPgConnected()) {
    try {
      const res = await pgManager.query(
        `SELECT 1 FROM revoked_tokens WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1`,
        [tokenHash]
      );
      if (res.rows.length > 0) {
        tokenBlacklist.set(tokenHash, { expiresAtMs: Date.now() + 3600 * 1e3 });
        return true;
      }
    } catch (err) {
      console.warn("\u26A0\uFE0F [Auth] Erreur v\xE9rification r\xE9vocation PostgreSQL:", err.message);
    }
  }
  return false;
}
function isStrongPassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, reason: "Le mot de passe est obligatoire." };
  }
  if (password.length < 10) {
    return { valid: false, reason: "Le mot de passe doit comporter au moins 10 caract\xE8res." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Le mot de passe doit contenir au moins une lettre majuscule (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Le mot de passe doit contenir au moins une lettre minuscule (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Le mot de passe doit contenir au moins un chiffre (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, reason: "Le mot de passe doit contenir au moins un caract\xE8re sp\xE9cial (!@#$%^&*...)." };
  }
  return { valid: true };
}
async function hashPassword(plainText) {
  const rounds = process.env.NODE_ENV === "production" ? 12 : 10;
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plainText, salt);
}
async function comparePassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}
function generateToken(user) {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();
  const payload = {
    id: user.id,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };
  const signOptions = {
    expiresIn
  };
  return jwt.sign(payload, secret, signOptions);
}
function verifyToken(token) {
  if (!token || isTokenRevoked(token)) {
    return null;
  }
  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// server/data/defaultCatalog.ts
var DEFAULT_SERVICES = [
  {
    id: "impression-numerique",
    groupId: "imprimerie",
    groupTitle: "Imprimerie",
    category: "Impression num\xE9rique",
    title: "Impression num\xE9rique",
    shortDesc: "Tirages rapides haute d\xE9finition pour petits et moyens volumes.",
    fullDesc: "Impression num\xE9rique laser et jet d\u2019encre HD sur traceurs et presses num\xE9riques r\xE9centes. Id\xE9al pour vos besoins urgents (d\xE9pliants, flyers, menus, affiches, th\xE8ses) avec un rendu chromatique fid\xE8le et un s\xE9chage imm\xE9diat.",
    iconName: "Printer",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 1500,
    features: [
      "R\xE9solution optique jusqu\u2019\xE0 2400 x 2400 dpi",
      "Grammages support\xE9s de 70g \xE0 400g couch\xE9 / textur\xE9",
      "D\xE9lais express disponibles en 24h chrono",
      "Personnalisation de donn\xE9es variables (adresses, QR codes)"
    ],
    sampleDeliverables: ["Flyers", "Menus plastifi\xE9s", "Affiches A3/A4", "Rapports d\u2019activit\xE9"],
    quoteTypePrestation: "Impression num\xE9rique HD"
  },
  {
    id: "offset",
    groupId: "imprimerie",
    groupTitle: "Imprimerie",
    category: "Impression Offset",
    title: "Offset grand tirage",
    shortDesc: "Production industrielle de gros tirages avec co\xFBt unitaire ultra-comp\xE9titif.",
    fullDesc: "Parc machine offset Heidelberg et Komori pour la production de volumes importants de documents institutionnels, revues, brochures, \xE9tiquettes et emballages avec une r\xE9gularit\xE9 de calage exemplaire.",
    iconName: "Layers",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 35e3,
    features: [
      "Capacit\xE9 de tirage jusqu\u2019\xE0 100 000 exemplaires/jour",
      "Couleurs quadrichromie CMJN + tons directs Pantone garantis",
      "Pelliculage mat/brillant, vernis UV s\xE9lectif & gaufrage",
      "\xC9conomies d\u2019\xE9chelle massives sur les gros volumes"
    ],
    sampleDeliverables: ["Magazines", "Catalogues 24-96 pages", "Brochures d\u2019entreprise", "D\xE9pliants 3 volets"],
    quoteTypePrestation: "Impression Offset gros tirage"
  },
  {
    id: "serigraphie-imprimerie",
    groupId: "imprimerie",
    groupTitle: "Imprimerie",
    category: "S\xE9rigraphie",
    title: "S\xE9rigraphie industrielle",
    shortDesc: "Impression directe par cadre sur textiles, m\xE9taux, bois, PVC et objets plats.",
    fullDesc: "Atelier de s\xE9rigraphie semi-automatique avec encres plastisol, aqueuses et solvants haute r\xE9sistance aux lavages et intemp\xE9ries. Impression sur t-shirts, casquettes, sacs cabas, tabliers et plaques rigides.",
    iconName: "Shirt",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 2500,
    features: [
      "Encres opaques sur supports clairs et fonc\xE9s",
      "Broderie industrielle et flocage thermocollant en option",
      "Excellente tenue aux lavages r\xE9p\xE9t\xE9s (>60\xB0C)",
      "D\xE9clinaisons sur t-shirts 100% coton, polos piqu\xE9s et tabliers"
    ],
    sampleDeliverables: ["Polos brod\xE9s", "T-shirts \xE9v\xE9nementiels", "Chasubles de chantier", "Casquettes"],
    quoteTypePrestation: "S\xE9rigraphie & Objets promotionnels"
  },
  {
    id: "grand-format-imprimerie",
    groupId: "imprimerie",
    groupTitle: "Imprimerie",
    category: "Grand format",
    title: "Grand format & Traceurs",
    shortDesc: "Roll-ups, b\xE2ches, affiches g\xE9antes, kak\xE9monos & posters.",
    fullDesc: "Impression sur traceurs \xE9co-solvants et UV haute durabilit\xE9 pour la communication visuelle de salon, les devantures et l\u2019affichage urbain.",
    iconName: "Maximize",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 6e3,
    features: [
      "Largeur d\u2019impression continue jusqu\u2019\xE0 3.20 m\xE8tres sans raccord",
      "Supports : B\xE2che vinyle 510g, vinyle autocollant, microperfor\xE9, toile canvas",
      "Fourniture de structures aluminium r\xE9tractables ultra-l\xE9g\xE8res",
      "R\xE9sistance aux UV solaires et pluies tropicales"
    ],
    sampleDeliverables: ["Roll-up 85x200cm", "Kak\xE9monos suspendus", "B\xE2ches tendues avec \u0153illets", "Posters photo HD"],
    quoteTypePrestation: "Grand format (Roll-up, B\xE2ches)"
  },
  {
    id: "papeterie-bureau",
    groupId: "imprimerie",
    groupTitle: "Imprimerie",
    category: "Papeterie administrative",
    title: "Papeterie d\u2019entreprise",
    shortDesc: "Cartes de visite de prestige, t\xEAtes de lettre, enveloppes & chemises.",
    fullDesc: "L\u2019ensemble de vos supports administratifs professionnels imprim\xE9s avec une r\xE9gularit\xE9 et une \xE9l\xE9gance qui valorisent l\u2019image de marque de votre structure.",
    iconName: "BookOpen",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 5e3,
    features: [
      "Cartes de visite 350g/400g couch\xE9 mat, coins arrondis, dorure \xE0 chaud",
      "Papiers \xE0 en-t\xEAte 80g/90g compatibles imprimantes laser & jet d\u2019encre",
      "Enveloppes personnalis\xE9es formats DL, C5, C4 avec bande autocollante",
      "Chemises \xE0 rabats avec fentes d\u2019insertion de cartes"
    ],
    sampleDeliverables: ["Cartes de visite luxe", "Papiers en-t\xEAte officiels", "Enveloppes \xE0 logo", "Chemises cartonn\xE9es"],
    quoteTypePrestation: "Cartes de visite & Papeterie"
  },
  {
    id: "facturiers",
    groupId: "imprimerie",
    groupTitle: "Imprimerie",
    category: "Facturiers",
    title: "Facturiers autocopiants",
    shortDesc: "Carnets dupli, tripli et quadrupli avec souche d\xE9tachable microperfor\xE9e.",
    fullDesc: "Facturiers et re\xE7us autocopiants chimiques de premi\xE8re qualit\xE9 (CB/CFB/CF) permettant une duplication nette et sans bavure de vos transactions commerciales et re\xE7us de caisse.",
    iconName: "FileText",
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 1800,
    features: [
      "Feuillets autocopiants 55g blanc, jaune, rose, bleu, vert",
      "Micro-perforation fine pour d\xE9tachement net sans d\xE9chirure",
      "Num\xE9rotation m\xE9canique cons\xE9cutive (ex: 0001 \xE0 2500)",
      "Couverture enveloppante avec intercalaire cartonn\xE9 int\xE9gr\xE9"
    ],
    sampleDeliverables: ["Facturiers dupli A4/A5", "Re\xE7us de paiement tripli", "Bons de caisse", "Ordres de mission"],
    quoteTypePrestation: "Carnets factures autocopiants"
  },
  {
    id: "conception-graphique",
    groupId: "communication-branding",
    groupTitle: "Communication & Branding",
    category: "Conception graphique",
    title: "Conception graphique & PAO",
    shortDesc: "Cr\xE9ation de visuels percutants, maquettes d\u2019impression & packaging.",
    fullDesc: "Studio graphique int\xE9gr\xE9 : infographistes chevronn\xE9s ma\xEEtrisant la cha\xEEne graphique (Adobe Illustrator, Photoshop, InDesign) pour concevoir vos supports avec une haute exigence esth\xE9tique.",
    iconName: "Palette",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 1e4,
    features: [
      "Cr\xE9ation de maquettes conformes aux contraintes d\u2019imprimerie (fonds perdus, traits de coupe, CMJN)",
      "Vectorisation haute pr\xE9cision de logos anciens ou basse r\xE9solution",
      "Conception de visuels optimis\xE9s pour Facebook, WhatsApp, Instagram et LinkedIn",
      "Accompagnement cr\xE9atif et proposition de plusieurs pistes graphiques"
    ],
    sampleDeliverables: ["Affiches publicitaires", "Packaging produit", "Visuels r\xE9seaux sociaux", "Plaquettes commerciales"],
    quoteTypePrestation: "Conception graphique & Branding"
  },
  {
    id: "identite-visuelle",
    groupId: "communication-branding",
    groupTitle: "Communication & Branding",
    category: "Identit\xE9 visuelle",
    title: "Identit\xE9 visuelle & Charte graphique",
    shortDesc: "Cr\xE9ation de logo professionnel, typographies, palette chromatique & brandbook.",
    fullDesc: "Nous donnons vie \xE0 une identit\xE9 visuelle p\xE9renne, moderne et diff\xE9renciante pour votre organisation, comprenant un logo original vectoriel, les d\xE9clinaisons monochrome et couleur, et le guide des normes.",
    iconName: "Sparkles",
    image: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 5e4,
    features: [
      "Livrables aux formats vectoriels (AI, EPS, SVG) et haute r\xE9solution (PNG transparent, PDF HD)",
      "Guide d\u2019usage des couleurs Pantone, CMJN, RVB et codes Hexad\xE9cimaux",
      "D\xE9clinaisons horizontales, verticales et favicon",
      "Cession totale des droits d\u2019exploitation graphique"
    ],
    sampleDeliverables: ["Logo officiel", "Brandbook (Guide de style)", "Mod\xE8les de papeterie", "Templates r\xE9seaux sociaux"],
    quoteTypePrestation: "Conception graphique & Branding"
  },
  {
    id: "enseignes-lumineuses",
    groupId: "communication-branding",
    groupTitle: "Communication & Branding",
    category: "Enseignes",
    title: "Enseignes lumineuses & Caissons 3D",
    shortDesc: "Enseignes en lettres bo\xEEtiers relief LED, caissons lumineux & n\xE9ons.",
    fullDesc: "Fabrication sur mesure et installation d\u2019enseignes lumineuses pour fa\xE7ades commerciales, pharmacies et agences. Valorisez votre point de vente jour et nuit.",
    iconName: "Signpost",
    image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 12e4,
    features: [
      "Lettres reliefs 3D thermoform\xE9es en plexiglas diffusant",
      "\xC9clairage modules LED basse consommation \xE9tanches IP67",
      "Structure portante en profil\xE9s aluminium laqu\xE9 anticorrosion",
      "Garantie pi\xE8ces et main d\u2019\u0153uvre + maintenance sur site"
    ],
    sampleDeliverables: ["Enseignes de pharmacie", "Lettres d\xE9coup\xE9es 3D", "Caissons lumineux double face", "Totems lumineux"],
    quoteTypePrestation: "Signal\xE9tique & Enseignes"
  },
  {
    id: "informatique",
    groupId: "solutions-pro",
    groupTitle: "Solutions Professionnelles",
    category: "Informatique",
    title: "Solutions informatiques & \xC9quipements",
    shortDesc: "Maintenance de parcs informatiques, consommables, imprimantes & r\xE9seaux.",
    fullDesc: "Fourniture de mat\xE9riel informatique bureautique de grandes marques (HP, Dell, Canon, Epson), installation de r\xE9seaux locaux d\u2019entreprise, vente de toners et cartouches d\u2019origine, et contrats de maintenance pr\xE9ventive et curative.",
    iconName: "Monitor",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    popular: true,
    active: true,
    priceStartingAt: 15e3,
    features: [
      "Vente et d\xE9ploiement d\u2019ordinateurs de bureau et ordinateurs portables",
      "Fourniture de toners, tambours et cartouches d\u2019encre certifi\xE9s authentiques",
      "C\xE2blage r\xE9seau Ethernet certifi\xE9, baies de brassage et points d\u2019acc\xE8s Wi-Fi",
      "Contrats d\u2019assistance technique sur site avec d\xE9lai d\u2019intervention garanti"
    ],
    sampleDeliverables: ["Parc ordinateurs", "Cartouches et Toners originaux", "Onduleurs de protection", "R\xE9seau informatique"],
    quoteTypePrestation: "Informatique & Multiservices"
  }
];
var DEFAULT_PRICE_CATEGORIES = [
  {
    id: "carnets",
    name: "Carnets, Facturiers & Sant\xE9",
    iconName: "BookOpen",
    description: "Facturiers autocopiants, bordereaux, carnets de sant\xE9 et ordonnanciers",
    items: [
      {
        id: "carnet-auto-dupli-a4",
        name: "Carnet Autocopiant Dupli (50 feuilles)",
        category: "Carnets & Facturiers",
        format: "Format A4",
        specs: "Dupli (50 feuilles doubles autocopiantes)",
        unitPrice: 2300,
        unit: "FCFA / carnet",
        popular: true,
        active: true
      },
      {
        id: "carnet-auto-dupli-a5",
        name: "Carnet Autocopiant Dupli (50 feuilles)",
        category: "Carnets & Facturiers",
        format: "Format A5",
        specs: "Dupli (50 feuilles doubles autocopiantes)",
        unitPrice: 1800,
        unit: "FCFA / carnet",
        popular: true,
        active: true
      },
      {
        id: "carnet-auto-tripli-a4",
        name: "Carnet Autocopiant Tripli",
        category: "Carnets & Facturiers",
        format: "Format A4",
        specs: "Tripli (3 feuillets autocopiants par souche)",
        unitPrice: 2800,
        unit: "FCFA / carnet",
        popular: true,
        active: true
      },
      {
        id: "carnet-auto-tripli-a5",
        name: "Carnet Autocopiant Tripli",
        category: "Carnets & Facturiers",
        format: "Format A5",
        specs: "Tripli (3 feuillets autocopiants par souche)",
        unitPrice: 2300,
        unit: "FCFA / carnet",
        active: true
      }
    ]
  },
  {
    id: "cartes",
    name: "Cartes de Visite & Papeterie",
    iconName: "Sparkles",
    description: "Cartes professionnelles, papier \xE0 en-t\xEAte et chemises \xE0 rabats",
    items: [
      {
        id: "cartes-visite-100-std",
        name: "Pack 100 Cartes de Visite Plastifi\xE9es",
        category: "Cartes de Visite",
        format: "8.5 x 5.5 cm",
        specs: "Papier Couch\xE9 350g + Pelliculage Mat/Brillant R/V",
        unitPrice: 7500,
        unit: "FCFA / lot de 100",
        popular: true,
        active: true
      },
      {
        id: "cartes-visite-500-luxe",
        name: "Pack 500 Cartes de Visite Dorure / Soft-Touch",
        category: "Cartes de Visite",
        format: "8.5 x 5.5 cm",
        specs: "Touch\xE9 Velours Soft-Touch + Dorure \xE0 chaud or/argent",
        unitPrice: 35e3,
        unit: "FCFA / lot de 500",
        popular: true,
        active: true
      },
      {
        id: "papier-entete-1000",
        name: "Papiers \xE0 en-t\xEAte Officiels (1000 ex)",
        category: "Papeterie",
        format: "A4 (21 x 29.7 cm)",
        specs: "Papier Extra-Blanc 80g laser garanti",
        unitPrice: 45e3,
        unit: "FCFA / mille",
        active: true
      }
    ]
  },
  {
    id: "grand-format",
    name: "B\xE2ches, Roll-ups & Grand Format",
    iconName: "Maximize",
    description: "B\xE2ches tendues, roll-ups d\u2019exposition, kak\xE9monos et vinyles",
    items: [
      {
        id: "rollup-85x200",
        name: "Roll-up Aluminium 85 x 200 cm Complet",
        category: "Roll-up",
        format: "85 x 200 cm",
        specs: "Structure alu renforc\xE9e + B\xE2che PVC 510g HD + Housse",
        unitPrice: 28e3,
        unit: "FCFA / unit\xE9",
        popular: true,
        active: true
      },
      {
        id: "bache-oeuillets-m2",
        name: "B\xE2che PVC \xC9v\xE9nementielle (au m\xB2)",
        category: "B\xE2ches",
        format: "Sur mesure (m\xB2)",
        specs: "B\xE2che 510g avec ourlets de renfort et \u0153illets inox",
        unitPrice: 4e3,
        unit: "FCFA / m\xB2",
        popular: true,
        active: true
      }
    ]
  }
];
var DEFAULT_TESTIMONIALS = [
  {
    id: "t1",
    author: "Dr. Mamoudou Bello",
    role: "Doyen de Facult\xE9",
    company: "Universit\xE9 de Ngaound\xE9r\xE9",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    comment: "BARKA SOLUTIONS est notre partenaire privil\xE9gi\xE9 pour l\u2019impression de nos actes de colloques, dipl\xF4mes et affichages universitaires. La qualit\xE9 du papier et le respect strict des d\xE9lais sont irr\xE9prochables.",
    rating: 5,
    date: "F\xE9vrier 2026",
    project: "Actes de colloques & affichage officiel"
  },
  {
    id: "t2",
    author: "A\xEFssatou Oumarou",
    role: "Directrice G\xE9n\xE9rale",
    company: "Sahel Distribution SARL",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    comment: "Nous avons confi\xE9 \xE0 BARKA SOLUTIONS l\u2019habillage complet de nos 4 v\xE9hicules de livraison et la fabrication de nos enseignes lumineuses \xE0 Ngaound\xE9r\xE9. R\xE9sultat impeccable, tr\xE8s professionnel !",
    rating: 5,
    date: "Janvier 2026",
    project: "Habillage de v\xE9hicules & Enseignes LED"
  },
  {
    id: "t3",
    author: "Jean-Paul Nkoumou",
    role: "Chef de Projet Communication",
    company: "ONG Solidarit\xE9 Cameroun",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    comment: "Des prix tr\xE8s comp\xE9titifs, une r\xE9activit\xE9 par WhatsApp impressionnante et une livraison rapide m\xEAme pour nos commandes urgentes de b\xE2ches et de t-shirts s\xE9rigraphi\xE9s.",
    rating: 5,
    date: "D\xE9cembre 2025",
    project: "Banderoles grand format & T-shirts"
  }
];

// server/db/database.ts
var DATA_DIR = path2.join(process.cwd(), "server", "data");
var DB_FILE = path2.join(DATA_DIR, "store.json");
function normalizeQuoteStatus(status) {
  if (!status) return "NOUVEAU";
  const upper = status.trim();
  const mapping = {
    "NOUVEAU": "NOUVEAU",
    "EN_ANALYSE": "EN_ANALYSE",
    "DEVIS_EN_PREPARATION": "DEVIS_EN_PREPARATION",
    "DEVIS_ENVOYE": "DEVIS_ENVOYE",
    "EN_ATTENTE_CLIENT": "EN_ATTENTE_CLIENT",
    "ACCEPTE": "ACCEPTE",
    "EN_PRODUCTION": "EN_PRODUCTION",
    "TERMINE": "TERMINE",
    "ANNULE": "ANNULE",
    "Nouveau": "NOUVEAU",
    "En cours": "EN_PRODUCTION",
    "Trait\xE9": "TERMINE",
    "Archiv\xE9": "TERMINE",
    "Annul\xE9": "ANNULE"
  };
  return mapping[upper] || "NOUVEAU";
}
var ALLOWED_QUOTE_TRANSITIONS = {
  "NOUVEAU": ["EN_ANALYSE", "DEVIS_EN_PREPARATION", "DEVIS_ENVOYE", "EN_ATTENTE_CLIENT", "ACCEPTE", "EN_PRODUCTION", "ANNULE", "NOUVEAU"],
  "EN_ANALYSE": ["DEVIS_EN_PREPARATION", "DEVIS_ENVOYE", "EN_ATTENTE_CLIENT", "ACCEPTE", "EN_PRODUCTION", "ANNULE", "NOUVEAU"],
  "DEVIS_EN_PREPARATION": ["DEVIS_ENVOYE", "EN_ATTENTE_CLIENT", "ACCEPTE", "EN_PRODUCTION", "ANNULE", "EN_ANALYSE", "DEVIS_EN_PREPARATION"],
  "DEVIS_ENVOYE": ["EN_ATTENTE_CLIENT", "ACCEPTE", "EN_PRODUCTION", "ANNULE", "DEVIS_EN_PREPARATION", "DEVIS_ENVOYE"],
  "EN_ATTENTE_CLIENT": ["ACCEPTE", "DEVIS_EN_PREPARATION", "EN_PRODUCTION", "ANNULE", "EN_ANALYSE", "EN_ATTENTE_CLIENT"],
  "ACCEPTE": ["EN_PRODUCTION", "TERMINE", "ANNULE", "ACCEPTE"],
  "EN_PRODUCTION": ["TERMINE", "ANNULE", "ACCEPTE", "EN_PRODUCTION"],
  "TERMINE": ["TERMINE", "ANNULE"],
  "ANNULE": ["NOUVEAU", "EN_ANALYSE", "ANNULE"]
};
function isValidQuoteStatusTransition(currentStatus, newStatus) {
  const normCurrent = normalizeQuoteStatus(currentStatus);
  const normNew = normalizeQuoteStatus(newStatus);
  if (normCurrent === normNew) return true;
  const allowed = ALLOWED_QUOTE_TRANSITIONS[normCurrent];
  return !!allowed && allowed.includes(normNew);
}
var AsyncMutex = class {
  constructor() {
    this.queue = Promise.resolve();
  }
  lock() {
    let unlock = () => {
    };
    const nextLock = new Promise((resolve) => {
      unlock = resolve;
    });
    const willLock = this.queue.then(() => unlock);
    this.queue = this.queue.then(() => nextLock);
    return willLock;
  }
};
var Database = class {
  constructor() {
    this.store = {
      users: [],
      companySettings: { ...DEFAULT_COMPANY_SETTINGS },
      quotes: [],
      messages: [],
      portfolio: [],
      services: [...DEFAULT_SERVICES],
      priceCategories: [...DEFAULT_PRICE_CATEGORIES],
      testimonials: [...DEFAULT_TESTIMONIALS],
      auditLogs: [],
      lastQuoteSequence: 0
    };
    this.quoteLock = new AsyncMutex();
    this.isInitialized = false;
    this.store.portfolio = this.getSeededPortfolio();
    this.init();
  }
  async init() {
    try {
      if (!process.env.VERCEL) {
        try {
          if (!fs2.existsSync(DATA_DIR)) {
            fs2.mkdirSync(DATA_DIR, { recursive: true });
          }
        } catch {
        }
      }
      let loadedFromDisk = false;
      try {
        if (fs2.existsSync(DB_FILE)) {
          const raw = fs2.readFileSync(DB_FILE, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            this.store = {
              ...this.store,
              ...parsed,
              portfolio: Array.isArray(parsed.portfolio) && parsed.portfolio.length > 0 ? parsed.portfolio : this.getSeededPortfolio(),
              services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : [...DEFAULT_SERVICES],
              priceCategories: Array.isArray(parsed.priceCategories) && parsed.priceCategories.length > 0 ? parsed.priceCategories : [...DEFAULT_PRICE_CATEGORIES],
              testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : [...DEFAULT_TESTIMONIALS]
            };
            loadedFromDisk = true;
            console.log(`[DB] \u{1F4BE} Donn\xE9es de d\xE9part charg\xE9es (${this.store.quotes?.length || 0} devis, ${this.store.portfolio?.length || 0} r\xE9alisations, ${this.store.services?.length || 0} services)`);
          }
        }
      } catch (e) {
        console.warn("\u26A0\uFE0F [DB] Lecture store.json impossible, utilisation du catalogue par d\xE9faut :", e.message);
      }
      if (!loadedFromDisk) {
        await this.seedInitialData();
        this.persist();
      }
      if (!this.store.users || this.store.users.length === 0) {
        await this.seedInitialData();
        this.persist();
      }
      if (!this.store.companySettings) {
        this.store.companySettings = { ...DEFAULT_COMPANY_SETTINGS };
        this.persist();
      }
      if (!this.store.portfolio || this.store.portfolio.length === 0) {
        this.store.portfolio = this.getSeededPortfolio();
        this.persist();
      }
      if (!this.store.services || this.store.services.length === 0) {
        this.store.services = [...DEFAULT_SERVICES];
        this.persist();
      }
      if (!this.store.priceCategories || this.store.priceCategories.length === 0) {
        this.store.priceCategories = [...DEFAULT_PRICE_CATEGORIES];
        this.persist();
      }
      if (!this.store.testimonials || this.store.testimonials.length === 0) {
        this.store.testimonials = [...DEFAULT_TESTIMONIALS];
        this.persist();
      }
      if (this.store.quotes && Array.isArray(this.store.quotes)) {
        let modifiedQuotes = false;
        this.store.quotes = this.store.quotes.map((q) => {
          const normStatus = normalizeQuoteStatus(q.status);
          const normHistory = Array.isArray(q.statusHistory) ? q.statusHistory.map((h) => ({ ...h, status: normalizeQuoteStatus(h.status) })) : [{ status: normStatus, changedAt: q.submittedAt, note: "Cr\xE9ation initiale" }];
          if (q.status !== normStatus) {
            modifiedQuotes = true;
          }
          return {
            ...q,
            status: normStatus,
            statusHistory: normHistory
          };
        });
        if (modifiedQuotes) {
          this.persist();
        }
      }
      const isPg = await pgManager.checkConnection();
      if (isPg) {
        await pgManager.runMigrations();
        await pgManager.seedFromStoreIfEmpty();
        await this.loadFromPostgres();
      } else {
        console.log("\u2139\uFE0F [DB] Mode PostgreSQL pr\xEAt. Fallback local / store.json actif.");
      }
      this.isInitialized = true;
    } catch (err) {
      console.error("[DB] Erreur initialisation base de donn\xE9es:", err);
      await this.seedInitialData();
    }
  }
  async loadFromPostgres() {
    try {
      const usersRes = await pgManager.query("SELECT * FROM users ORDER BY created_at ASC");
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
          updatedAt: row.updated_at?.toISOString()
        }));
      }
      const companyRes = await pgManager.query("SELECT * FROM company_settings LIMIT 1");
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
          whatsapp_raw: row.whatsapp_raw || "237696311198",
          email_primary: row.email_primary,
          email_secondary: row.email_secondary,
          website: row.website || "",
          logo: row.logo_url || "/assets/logo-barka.png",
          opening_hours: row.opening_hours || DEFAULT_COMPANY_SETTINGS.opening_hours,
          social_links: row.social_links || DEFAULT_COMPANY_SETTINGS.social_links
        };
      }
      const servicesRes = await pgManager.query("SELECT * FROM services ORDER BY created_at ASC");
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
          updatedAt: row.updated_at?.toISOString()
        }));
      }
      const portfolioRes = await pgManager.query("SELECT * FROM portfolio ORDER BY created_at DESC");
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
          updatedAt: row.updated_at?.toISOString()
        }));
      }
      const catRes = await pgManager.query("SELECT * FROM price_categories ORDER BY sort_order ASC");
      const pricesRes = await pgManager.query("SELECT * FROM prices ORDER BY sort_order ASC");
      if (catRes.rows.length > 0) {
        this.store.priceCategories = catRes.rows.map((cat) => {
          const items = pricesRes.rows.filter((p) => p.category_id === cat.id).map((p) => ({
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
            order: p.sort_order
          }));
          return {
            id: cat.id,
            name: cat.name,
            iconName: cat.icon_name,
            description: cat.description,
            order: cat.sort_order,
            items
          };
        });
      }
      const quotesRes = await pgManager.query("SELECT * FROM quotes ORDER BY submitted_at DESC");
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
          finalPrice: row.final_price ? Number(row.final_price) : void 0,
          status: normalizeQuoteStatus(row.status),
          adminNotes: row.admin_notes,
          files: row.files || [],
          statusHistory: row.status_history || [],
          submittedAt: row.submitted_at?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const msgRes = await pgManager.query("SELECT * FROM messages ORDER BY created_at DESC");
      if (msgRes.rows.length > 0) {
        this.store.messages = msgRes.rows.map((row) => ({
          id: row.id,
          name: row.name,
          emailOrPhone: row.email_or_phone,
          subject: row.subject,
          message: row.message,
          read: row.is_read,
          adminReply: row.admin_reply,
          createdAt: row.created_at?.toISOString()
        }));
      }
      const testRes = await pgManager.query("SELECT * FROM testimonials WHERE is_approved = true ORDER BY created_at DESC");
      if (testRes.rows.length > 0) {
        this.store.testimonials = testRes.rows.map((row) => ({
          id: row.id,
          author: row.author,
          role: row.role,
          company: row.company,
          avatar: row.avatar_url,
          comment: row.comment,
          rating: row.rating,
          date: row.date_label || "2026",
          project: row.project,
          createdAt: row.created_at?.toISOString()
        }));
      }
      const auditRes = await pgManager.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500");
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
          createdAt: row.created_at?.toISOString()
        }));
      }
      console.log("\u2705 [PostgreSQL] Donn\xE9es synchronis\xE9es avec succ\xE8s depuis PostgreSQL dans le store.");
      this.persist();
    } catch (err) {
      console.warn("\u26A0\uFE0F [PostgreSQL] Erreur lors du chargement des donn\xE9es depuis PostgreSQL :", err.message);
    }
  }
  getSeededPortfolio() {
    return [
      {
        id: "port-001",
        title: "Brochure & Catalogue d\u2019Entreprise 24 Pages",
        category: "Offset",
        categories: ["Offset", "Imprimerie"],
        description: "Exemple de catalogue institutionnel 24 pages avec papier couch\xE9 satin\xE9 250g, vernis s\xE9lectif et reliure piq\xFBre \xE0 cheval soign\xE9e.",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80"
        ],
        client: "Sp\xE9cimen d\xE9mo (Secteur Agroalimentaire)",
        year: "2026",
        tags: ["Catalogue", "Brochure", "Impression Offset", "D\xE9monstration"],
        serviceAssocie: "Impression offset & Catalogues",
        serviceId: "offset",
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 36e5 * 24 * 10).toISOString()
      },
      {
        id: "port-002",
        title: "Enseigne Lumineuse LED 3D Relief & Totem",
        category: "Signal\xE9tique",
        categories: ["Signal\xE9tique", "Branding"],
        description: "Exemple d\u2019enseigne r\xE9tro-\xE9clair\xE9e LED en lettres bo\xEEtiers aluminium anodis\xE9 et plexiglas diffusant haute visibilit\xE9 de nuit.",
        image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80"
        ],
        client: "Sp\xE9cimen d\xE9mo (Secteur H\xF4tellerie)",
        year: "2026",
        tags: ["Enseigne", "LED", "Plexiglas", "Signal\xE9tique", "D\xE9monstration"],
        serviceAssocie: "Enseignes & Signal\xE9tique",
        serviceId: "enseignes",
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 36e5 * 24 * 8).toISOString()
      },
      {
        id: "port-003",
        title: "Cartes de Visite Prestige Dorure \xE0 Chaud & Soft-Touch",
        category: "Num\xE9rique",
        categories: ["Num\xE9rique", "Papeterie"],
        description: "Exemple de cartes de visite 400g touch\xE9 soft-touch avec dorure \xE0 chaud dor\xE9e et tranche teint\xE9e bleu nuit.",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80"
        ],
        client: "Sp\xE9cimen d\xE9mo (Cabinet Juridique)",
        year: "2026",
        tags: ["Cartes de visite", "Dorure", "Soft-touch", "Luxe", "D\xE9monstration"],
        serviceAssocie: "Papeterie d\u2019entreprise",
        serviceId: "papeterie",
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 36e5 * 24 * 7).toISOString()
      },
      {
        id: "port-004",
        title: "Roll-up & Banderoles Grand Format pour Salon Pro",
        category: "Grand format",
        categories: ["Grand format", "Communication"],
        description: "Exemple de structures aluminium renforc\xE9es avec b\xE2che PVC anti-reflet HD et \u0153illets laiton pour \xE9v\xE9nements professionnels.",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80"
        ],
        client: "Sp\xE9cimen d\xE9mo (Secteur \xC9v\xE9nementiel & ONG)",
        year: "2026",
        tags: ["Roll-up", "Grand Format", "Salon", "\xC9v\xE9nementiel", "D\xE9monstration"],
        serviceAssocie: "Grand format & Banderoles",
        serviceId: "grand-format",
        featured: false,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 36e5 * 24 * 6).toISOString()
      },
      {
        id: "port-005",
        title: "T-shirts & Polos Brod\xE9s pour Personnel d\u2019Atelier",
        category: "S\xE9rigraphie",
        categories: ["S\xE9rigraphie", "Branding"],
        description: "Exemple de s\xE9rigraphie 4 couleurs haute tenue et broderie poitrine de pr\xE9cision sur polos piqu\xE9s 220g pour tenues professionnelles.",
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80"
        ],
        client: "Sp\xE9cimen d\xE9mo (Secteur BTP & Industrie)",
        year: "2026",
        tags: ["S\xE9rigraphie", "Textile", "Broderie", "Polos", "D\xE9monstration"],
        serviceAssocie: "S\xE9rigraphie & Textiles",
        serviceId: "serigraphie",
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 36e5 * 24 * 5).toISOString()
      },
      {
        id: "port-006",
        title: "Habillage Int\xE9gral de V\xE9hicules Utilitaires (Covering)",
        category: "Branding",
        categories: ["Branding", "Signal\xE9tique"],
        description: "Exemple de marquage adh\xE9sif coul\xE9 3M avec pelliculage anti-UV longue dur\xE9e pour flotte de livraison et camions frigorifiques.",
        image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80"
        ],
        client: "Sp\xE9cimen d\xE9mo (Secteur Distribution Logistique)",
        year: "2026",
        tags: ["Covering", "Branding V\xE9hicule", "Flotte", "Adh\xE9sif", "D\xE9monstration"],
        serviceAssocie: "Habillage & Covering",
        serviceId: "habillage",
        featured: true,
        active: true,
        isDemo: true,
        createdAt: new Date(Date.now() - 36e5 * 24 * 4).toISOString()
      }
    ];
  }
  async seedInitialData() {
    const adminInitialPass = process.env.ADMIN_INITIAL_PASSWORD?.trim() || crypto3.randomBytes(16).toString("hex");
    const editorInitialPass = process.env.EDITOR_INITIAL_PASSWORD?.trim() || crypto3.randomBytes(16).toString("hex");
    const adminHash = await hashPassword(adminInitialPass);
    const editorHash = await hashPassword(editorInitialPass);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.log("------------------------------------------------------------");
      console.log("\u{1F510} [S\xC9CURIT\xC9] Compte Administrateur initial g\xE9n\xE9r\xE9 :");
      console.log(`\u{1F449} Identifiant : admin | Mot de passe : ${adminInitialPass}`);
      console.log("\u{1F449} Identifiant : editor | Mot de passe : ${editorInitialPass}");
      console.log("------------------------------------------------------------");
    }
    this.store.users = [
      {
        id: "54b240ad-0e23-42b1-9531-78f01e32e309",
        username: "admin",
        email: "direction@barkasolutions.org",
        fullName: "Administrateur Principal BARKA",
        passwordHash: adminHash,
        role: "ADMIN",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "345c4630-9876-46bf-bfa5-8211ff295109",
        username: "editor",
        email: "kouchoumichel@yahoo.fr",
        fullName: "\xC9diteur & Gestionnaire Atelier",
        passwordHash: editorHash,
        role: "EDITOR",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];
    this.store.companySettings = { ...DEFAULT_COMPANY_SETTINGS };
    this.store.services = [...DEFAULT_SERVICES];
    this.store.priceCategories = [...DEFAULT_PRICE_CATEGORIES];
    this.store.testimonials = [...DEFAULT_TESTIMONIALS];
    this.store.portfolio = this.getSeededPortfolio();
    this.store.quotes = [
      {
        id: "BKS-2026-00001",
        nom: "Bouba",
        prenom: "Hamidou",
        nomComplet: "Hamidou Bouba",
        entreprise: "Coop\xE9rative Agro-Pastorale de Ngaound\xE9r\xE9",
        telephone: "+237 699 12 34 56",
        email: "h.bouba@coop-agro.cm",
        ville: "Ngaound\xE9r\xE9",
        typePrestation: "Carnets factures autocopiants",
        produit: "Facturiers Dupli A4",
        quantite: 50,
        format: "A4 (21 x 29.7 cm)",
        supportPapier: "Dupli (50 feuillets autocopiants)",
        grammage: "Autocopiant CB/CF 55g",
        impressionType: "Recto seul",
        finition: "Num\xE9rotation 001 \xE0 2500 + Souche agraf\xE9e",
        delai: "Standard (3-5 jours)",
        livraisonOption: "Retrait en agence (Ngaound\xE9r\xE9)",
        graphismeOption: "Fichier pr\xEAt fourni (HD)",
        description: "Facturiers 50 feuillets dupli num\xE9rot\xE9s de 001 \xE0 2500 avec logo couleur en en-t\xEAte.",
        estimatedPrice: 95e3,
        priceType: "FIXED",
        submittedAt: new Date(Date.now() - 36e5 * 24 * 3).toISOString(),
        status: "EN_PRODUCTION",
        adminNotes: "En cours de tirage sur presse offset. Pr\xEAt jeudi matin.",
        statusHistory: [
          { status: "NOUVEAU", changedAt: new Date(Date.now() - 36e5 * 24 * 3).toISOString(), note: "Enregistrement" },
          { status: "EN_ANALYSE", changedAt: new Date(Date.now() - 36e5 * 24 * 2.5).toISOString(), note: "V\xE9rification maquette" },
          { status: "ACCEPTE", changedAt: new Date(Date.now() - 36e5 * 24 * 2).toISOString(), note: "Acompte 50% re\xE7u" },
          { status: "EN_PRODUCTION", changedAt: new Date(Date.now() - 36e5 * 24 * 1).toISOString(), note: "Montage et tirage" }
        ]
      },
      {
        id: "BKS-2026-00002",
        nom: "Bello",
        prenom: "Aminatou",
        nomComplet: "Dr. Aminatou Bello",
        entreprise: "Clinique M\xE9dicale Espoir",
        telephone: "+237 677 88 99 00",
        email: "dr.bello@clinique-espoir.cm",
        ville: "Ngaound\xE9r\xE9",
        typePrestation: "Carnets de sant\xE9 & registres",
        produit: "Carnets de sant\xE9 p\xE9diatriques",
        quantite: 200,
        format: "A5 (14.8 x 21 cm)",
        supportPapier: "Papier Couch\xE9 Satin\xE9 300g (Couverture)",
        grammage: "Int\xE9rieur Offset 80g / Couverture 300g",
        impressionType: "Recto/Verso",
        finition: "Pelliculage brillant couverture + Deux agrafes",
        delai: "Express (24-48h)",
        livraisonOption: "Livraison Ngaound\xE9r\xE9 (+2 000 FCFA)",
        graphismeOption: "Fichier pr\xEAt fourni (HD)",
        description: "Carnets de sant\xE9 p\xE9diatriques personnalis\xE9s avec tableau vaccinal conforme Minist\xE8re de la Sant\xE9 Publique.",
        estimatedPrice: 14e4,
        priceType: "STARTING_AT",
        submittedAt: new Date(Date.now() - 36e5 * 6).toISOString(),
        status: "NOUVEAU",
        statusHistory: [
          { status: "NOUVEAU", changedAt: new Date(Date.now() - 36e5 * 6).toISOString(), note: "Nouvelle demande client" }
        ]
      }
    ];
    this.store.messages = [
      {
        id: "MSG-001",
        name: "Sali Mohamadou",
        emailOrPhone: "+237 690 11 22 33",
        subject: "Demande de devis enseigne lumineuse",
        message: "Bonjour, r\xE9alisez-vous \xE9galement des enseignes lumineuses LED 3D pour fa\xE7ades de magasins et pharmacies \xE0 Ngaound\xE9r\xE9 ?",
        createdAt: new Date(Date.now() - 36e5 * 24 * 2).toISOString(),
        read: true,
        adminReply: "Bonjour, oui tout \xE0 fait. Nous fabriquons sur mesure des enseignes lumineuses avec pose sur site."
      }
    ];
    this.store.auditLogs = [
      {
        id: "LOG-001",
        userId: "54b240ad-0e23-42b1-9531-78f01e32e309",
        username: "admin",
        userFullName: "Administrateur Principal BARKA",
        role: "ADMIN",
        action: "UPDATE",
        resource: "TARIF",
        resourceId: "price-flyers-a5",
        resourceTitle: "Flyers / Prospectus A5",
        description: "ADMIN a modifi\xE9 un tarif (Flyers / Prospectus A5).",
        oldValue: { unitPrice: 35, popular: false },
        newValue: { unitPrice: 30, popular: true },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 36e5 * 18).toISOString()
      },
      {
        id: "LOG-002",
        userId: "345c4630-9876-46bf-bfa5-8211ff295109",
        username: "editor",
        userFullName: "\xC9diteur & Gestionnaire Atelier",
        role: "EDITOR",
        action: "STATUS_CHANGE",
        resource: "DEVIS",
        resourceId: "BKS-2026-00001",
        resourceTitle: "Devis Coop\xE9rative Agro-Pastorale",
        description: "EDITOR a chang\xE9 le statut d'un devis (#BKS-2026-00001 : ACCEPTE -> EN_PRODUCTION).",
        oldValue: { status: "ACCEPTE" },
        newValue: { status: "EN_PRODUCTION", adminNotes: "En cours de tirage sur presse offset." },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 36e5 * 24).toISOString()
      },
      {
        id: "LOG-003",
        userId: "54b240ad-0e23-42b1-9531-78f01e32e309",
        username: "admin",
        userFullName: "Administrateur Principal BARKA",
        role: "ADMIN",
        action: "UPDATE",
        resource: "SERVICE",
        resourceId: "offset",
        resourceTitle: "Impression offset & Catalogues",
        description: "ADMIN a modifi\xE9 un service (Impression offset & Catalogues).",
        oldValue: { popular: false, priceStartingAt: 3e4 },
        newValue: { popular: true, priceStartingAt: 25e3 },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 36e5 * 36).toISOString()
      },
      {
        id: "LOG-004",
        userId: "54b240ad-0e23-42b1-9531-78f01e32e309",
        username: "admin",
        userFullName: "Administrateur Principal BARKA",
        role: "ADMIN",
        action: "DELETE",
        resource: "PORTFOLIO",
        resourceId: "port-old-archive",
        resourceTitle: "Ancienne Affiche D\xE9mo 2024",
        description: "ADMIN a supprim\xE9 un portfolio (Ancienne Affiche D\xE9mo 2024).",
        oldValue: { id: "port-old-archive", title: "Ancienne Affiche D\xE9mo 2024", category: "Offset" },
        newValue: null,
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 36e5 * 48).toISOString()
      },
      {
        id: "LOG-005",
        userId: "54b240ad-0e23-42b1-9531-78f01e32e309",
        username: "admin",
        userFullName: "Administrateur Principal BARKA",
        role: "ADMIN",
        action: "UPDATE",
        resource: "COMPANY_SETTINGS",
        resourceId: "barka-settings",
        resourceTitle: "Param\xE8tres BARKA SOLUTIONS S.A.S",
        description: "ADMIN a modifi\xE9 les coordonn\xE9es et param\xE8tres de l'entreprise.",
        oldValue: { address: "Ngaound\xE9r\xE9 Centre" },
        newValue: { address: "Derri\xE8re le Restaurant Le Verger, Ngaound\xE9r\xE9, Cameroun" },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 36e5 * 72).toISOString()
      }
    ];
    this.store.lastQuoteSequence = 2;
  }
  persist() {
    try {
      if (process.env.VERCEL) {
        try {
          const tmpFile = path2.join(os.tmpdir(), "store.json");
          fs2.writeFileSync(tmpFile, JSON.stringify(this.store, null, 2), "utf-8");
        } catch {
        }
        return;
      }
      fs2.writeFileSync(DB_FILE, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (err) {
      console.warn("[DB] \xC9criture store.json impossible (environnement en lecture seule) :", err.message);
    }
  }
  reloadFromFileIfNeeded() {
    try {
      if (fs2.existsSync(DB_FILE)) {
        const raw = fs2.readFileSync(DB_FILE, "utf-8");
        const diskStore = JSON.parse(raw);
        if (Array.isArray(diskStore.users)) {
          this.store.users = diskStore.users;
        }
      }
    } catch {
    }
  }
  // ================= USERS =================
  async findUserByUsername(username) {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
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
            updatedAt: row.updated_at?.toISOString()
          };
        }
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] findUserByUsername fallback:", err);
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
  async findUserById(id) {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query("SELECT * FROM users WHERE id = $1", [id]);
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
            updatedAt: row.updated_at?.toISOString()
          };
        }
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] findUserById fallback:", err);
      }
    }
    let found = this.store.users.find((u) => u.id === id);
    if (!found) {
      this.reloadFromFileIfNeeded();
      found = this.store.users.find((u) => u.id === id);
    }
    return found || null;
  }
  async findUserByEmail(email) {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
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
            updatedAt: row.updated_at?.toISOString()
          };
        }
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] findUserByEmail fallback:", err);
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
  async getAllUsers() {
    if (pgManager.isPgConnected()) {
      try {
        const res = await pgManager.query("SELECT id, username, email, full_name, role, avatar_url, is_active, last_login, created_at, updated_at FROM users ORDER BY created_at ASC");
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
            updatedAt: row.updated_at?.toISOString()
          }));
        }
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] getAllUsers fallback:", err);
      }
    }
    return this.store.users.map(({ passwordHash: _, ...user }) => user);
  }
  async createUser(user) {
    const id = crypto3.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now
    };
    if (pgManager.isPgConnected()) {
      try {
        await pgManager.query(
          `INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [newUser.id, newUser.username, newUser.email, newUser.passwordHash, newUser.fullName, newUser.role, newUser.isActive, now, now]
        );
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] createUser error:", err);
      }
    }
    this.store.users.push(newUser);
    this.persist();
    return newUser;
  }
  async updateUserLastLogin(id) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (pgManager.isPgConnected()) {
      try {
        await pgManager.query("UPDATE users SET last_login = $1, updated_at = $1 WHERE id = $2", [now, id]);
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] updateUserLastLogin error:", err);
      }
    }
    const user = this.store.users.find((u) => u.id === id);
    if (user) {
      user.lastLogin = now;
      user.updatedAt = now;
      this.persist();
    }
  }
  async deleteUser(id) {
    if (pgManager.isPgConnected()) {
      try {
        await pgManager.query("DELETE FROM users WHERE id = $1", [id]);
      } catch (err) {
        console.warn("\u26A0\uFE0F [PostgreSQL] deleteUser error:", err);
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
  getCompanySettings() {
    return { ...this.store.companySettings };
  }
  updateCompanySettings(settings) {
    this.store.companySettings = {
      ...this.store.companySettings,
      ...settings,
      opening_hours: {
        ...this.store.companySettings.opening_hours,
        ...settings.opening_hours || {}
      },
      social_links: {
        ...this.store.companySettings.social_links,
        ...settings.social_links || {}
      }
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
          cs.whatsapp_raw || "237696311198",
          cs.email_primary,
          cs.email_secondary,
          cs.website || "",
          cs.logo || "/assets/logo-barka.png",
          JSON.stringify(cs.opening_hours || {}),
          JSON.stringify(cs.social_links || {})
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] updateCompanySettings error:", err));
    }
    this.persist();
    return this.store.companySettings;
  }
  // ================= QUOTES (DEVIS) =================
  async getNextQuoteSequence(year) {
    const prefix = `BKS-${year}-`;
    let maxSeq = 0;
    if (this.store.quotes && Array.isArray(this.store.quotes)) {
      for (const q of this.store.quotes) {
        if (q.id && q.id.startsWith(prefix)) {
          const numPart = parseInt(q.id.replace(prefix, ""), 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
            maxSeq = numPart;
          }
        }
      }
    }
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
        console.warn("\u26A0\uFE0F [PostgreSQL] getNextQuoteSequence lookup warning:", err);
      }
    }
    return maxSeq + 1;
  }
  async generateNextQuoteId(year = (/* @__PURE__ */ new Date()).getFullYear()) {
    const nextSeq = await this.getNextQuoteSequence(year);
    return `BKS-${year}-${String(nextSeq).padStart(5, "0")}`;
  }
  getAllQuotes(status) {
    let quotes = [...this.store.quotes || []];
    if (status) {
      const norm = normalizeQuoteStatus(status);
      quotes = quotes.filter((q) => q.status === norm);
    }
    return quotes.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }
  getQuoteById(id) {
    return (this.store.quotes || []).find((q) => q.id === id) || null;
  }
  async createQuote(quoteData) {
    const unlock = await this.quoteLock.lock();
    try {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      let id = quoteData.id;
      if (!id) {
        id = await this.generateNextQuoteId(currentYear);
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const initialStatus = normalizeQuoteStatus(quoteData.status || "NOUVEAU");
      const newQuote = {
        ...quoteData,
        id,
        submittedAt: now,
        status: initialStatus,
        statusHistory: [
          {
            status: initialStatus,
            changedAt: now,
            note: "Nouvelle demande de devis enregistr\xE9e"
          }
        ]
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
              newQuote.prenom || "",
              newQuote.nomComplet || `${newQuote.prenom || ""} ${newQuote.nom}`.trim() || newQuote.nom,
              newQuote.entreprise || "Particulier",
              newQuote.telephone,
              newQuote.email || "",
              newQuote.ville || "Ngaound\xE9r\xE9",
              newQuote.typePrestation,
              newQuote.produit || null,
              newQuote.quantite || 1,
              newQuote.format || "Standard",
              newQuote.supportPapier || null,
              newQuote.grammage || null,
              newQuote.impressionType || "Recto seul",
              newQuote.finition || "Standard",
              newQuote.delai || "Standard (3-5 jours)",
              newQuote.livraisonOption || "Retrait en agence (Ngaound\xE9r\xE9)",
              newQuote.graphismeOption || "Fichier pr\xEAt fourni (HD)",
              newQuote.description || null,
              newQuote.estimatedPrice || 0,
              newQuote.priceType || "STARTING_AT",
              newQuote.status,
              newQuote.adminNotes || null,
              JSON.stringify(newQuote.statusHistory),
              JSON.stringify(newQuote.files || []),
              now
            ]
          );
        } catch (err) {
          console.warn("\u26A0\uFE0F [PostgreSQL] createQuote query warning:", err);
        }
      }
      this.persist();
      return newQuote;
    } finally {
      unlock();
    }
  }
  updateQuoteStatus(id, status, adminNotes, finalPrice, historyNote) {
    const quote = this.getQuoteById(id);
    if (!quote) return null;
    const normStatus = normalizeQuoteStatus(status);
    quote.status = normStatus;
    if (adminNotes !== void 0) quote.adminNotes = adminNotes;
    if (finalPrice !== void 0) quote.finalPrice = finalPrice;
    if (!quote.statusHistory) quote.statusHistory = [];
    quote.statusHistory.push({
      status: normStatus,
      changedAt: (/* @__PURE__ */ new Date()).toISOString(),
      note: historyNote || `Statut pass\xE9 \xE0 : ${normStatus}`
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
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] updateQuoteStatus error:", err));
    }
    this.persist();
    return quote;
  }
  updateQuote(id, updates, changedBy) {
    const quote = this.getQuoteById(id);
    if (!quote) return null;
    if (updates.status) {
      const normStatus = normalizeQuoteStatus(updates.status);
      updates.status = normStatus;
      if (!quote.statusHistory) quote.statusHistory = [];
      quote.statusHistory.push({
        status: normStatus,
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy,
        note: `Statut modifi\xE9 par ${changedBy || "Admin"} : ${normStatus}`
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
          id
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] updateQuote error:", err));
    }
    this.persist();
    return quote;
  }
  deleteQuote(id) {
    if (!this.store.quotes) return false;
    const initialLen = this.store.quotes.length;
    this.store.quotes = this.store.quotes.filter((q) => q.id !== id);
    if (this.store.quotes.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query("DELETE FROM quotes WHERE id = $1", [id]).catch(
          (err) => console.warn("\u26A0\uFE0F [PostgreSQL] deleteQuote error:", err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }
  // ================= PORTFOLIO =================
  getAllPortfolio(category, includeInactive = false) {
    let list = [...this.store.portfolio || []];
    if (!includeInactive) {
      list = list.filter((p) => p.active !== false);
    }
    if (category && category !== "Tous" && category !== "All") {
      const catLower = category.toLowerCase().trim();
      list = list.filter((p) => {
        const directCat = (p.category || "").toLowerCase().trim();
        const hasInCategories = Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().trim() === catLower);
        return directCat === catLower || hasInCategories;
      });
    }
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  getPortfolioById(id) {
    return (this.store.portfolio || []).find((p) => p.id === id) || null;
  }
  createPortfolioItem(itemData) {
    const id = itemData.id || `port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newItem = {
      ...itemData,
      id,
      categories: itemData.categories || [itemData.category],
      images: itemData.images || [itemData.image],
      tags: itemData.tags || [],
      featured: Boolean(itemData.featured),
      active: itemData.active !== void 0 ? itemData.active : true,
      isDemo: Boolean(itemData.isDemo),
      createdAt: now,
      updatedAt: now
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
          now
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] createPortfolioItem error:", err));
    }
    this.persist();
    return newItem;
  }
  updatePortfolioItem(id, updates) {
    const item = this.getPortfolioById(id);
    if (!item) return null;
    updates.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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
          id
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] updatePortfolioItem error:", err));
    }
    this.persist();
    return item;
  }
  togglePortfolioItem(id, explicitActive) {
    const item = this.getPortfolioById(id);
    if (!item) return null;
    item.active = explicitActive !== void 0 ? explicitActive : item.active === false ? true : false;
    item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (pgManager.isPgConnected()) {
      pgManager.query("UPDATE portfolio SET active = $1, updated_at = NOW() WHERE id = $2", [item.active, id]).catch(
        (err) => console.warn("\u26A0\uFE0F [PostgreSQL] togglePortfolioItem error:", err)
      );
    }
    this.persist();
    return item;
  }
  deletePortfolioItem(id) {
    if (!this.store.portfolio) return false;
    const initialLen = this.store.portfolio.length;
    this.store.portfolio = this.store.portfolio.filter((p) => p.id !== id);
    if (this.store.portfolio.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query("DELETE FROM portfolio WHERE id = $1", [id]).catch(
          (err) => console.warn("\u26A0\uFE0F [PostgreSQL] deletePortfolioItem error:", err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }
  // ================= MESSAGES =================
  getAllMessages(unreadOnly = false) {
    let list = [...this.store.messages || []];
    if (unreadOnly) {
      list = list.filter((m) => !m.read);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getMessageById(id) {
    return (this.store.messages || []).find((m) => m.id === id) || null;
  }
  createMessage(messageData) {
    const id = messageData.id || `MSG-${Date.now().toString().slice(-6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newMsg = {
      ...messageData,
      id,
      read: false,
      createdAt: now
    };
    if (!this.store.messages) this.store.messages = [];
    this.store.messages.unshift(newMsg);
    if (pgManager.isPgConnected()) {
      pgManager.query(
        `INSERT INTO messages (id, name, email_or_phone, subject, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newMsg.id, newMsg.name, newMsg.emailOrPhone, newMsg.subject || "Demande", newMsg.message, false, now]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] createMessage error:", err));
    }
    this.persist();
    return newMsg;
  }
  markMessageAsRead(id, isRead = true) {
    const msg = this.getMessageById(id);
    if (!msg) return null;
    msg.read = isRead;
    if (pgManager.isPgConnected()) {
      pgManager.query("UPDATE messages SET is_read = $1 WHERE id = $2", [isRead, id]).catch(
        (err) => console.warn("\u26A0\uFE0F [PostgreSQL] markMessageAsRead error:", err)
      );
    }
    this.persist();
    return msg;
  }
  replyToMessage(id, reply) {
    const msg = this.getMessageById(id);
    if (!msg) return null;
    msg.adminReply = reply;
    msg.read = true;
    if (pgManager.isPgConnected()) {
      pgManager.query("UPDATE messages SET admin_reply = $1, is_read = true WHERE id = $2", [reply, id]).catch(
        (err) => console.warn("\u26A0\uFE0F [PostgreSQL] replyToMessage error:", err)
      );
    }
    this.persist();
    return msg;
  }
  updateMessage(id, updates) {
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
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] updateMessage error:", err));
    }
    this.persist();
    return msg;
  }
  deleteMessage(id) {
    if (!this.store.messages) return false;
    const initialLen = this.store.messages.length;
    this.store.messages = this.store.messages.filter((m) => m.id !== id);
    if (this.store.messages.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query("DELETE FROM messages WHERE id = $1", [id]).catch(
          (err) => console.warn("\u26A0\uFE0F [PostgreSQL] deleteMessage error:", err)
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
    const newQuotes = quotes.filter((q) => q.status === "NOUVEAU").length;
    const inAnalysis = quotes.filter((q) => q.status === "EN_ANALYSE").length;
    const inPrep = quotes.filter((q) => q.status === "DEVIS_EN_PREPARATION").length;
    const sent = quotes.filter((q) => q.status === "DEVIS_ENVOYE").length;
    const waitingClient = quotes.filter((q) => q.status === "EN_ATTENTE_CLIENT").length;
    const accepted = quotes.filter((q) => q.status === "ACCEPTE").length;
    const inProduction = quotes.filter((q) => q.status === "EN_PRODUCTION").length;
    const completed = quotes.filter((q) => q.status === "TERMINE").length;
    const cancelled = quotes.filter((q) => q.status === "ANNULE").length;
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
      isPostgres: pgManager.isPgConnected()
    };
  }
  // ================= SERVICES =================
  getAllServices(activeOnly = false) {
    let list = [...this.store.services || []];
    if (activeOnly) {
      list = list.filter((s) => s.active !== false);
    }
    return list;
  }
  getServiceById(id) {
    return (this.store.services || []).find((s) => s.id === id) || null;
  }
  createService(serviceData) {
    const id = serviceData.id || `srv-${crypto3.randomUUID().slice(0, 8)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newService = {
      ...serviceData,
      id,
      active: serviceData.active !== void 0 ? serviceData.active : true,
      createdAt: now,
      updatedAt: now
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
          newService.groupId || "imprimerie",
          newService.groupTitle || "Imprimerie",
          newService.category,
          newService.title,
          newService.shortDesc,
          newService.fullDesc,
          newService.iconName || "Printer",
          newService.image,
          newService.priceStartingAt || 0,
          newService.popular || false,
          newService.active,
          JSON.stringify(newService.features || []),
          JSON.stringify(newService.sampleDeliverables || []),
          newService.quoteTypePrestation,
          now,
          now
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] createService error:", err));
    }
    this.persist();
    return newService;
  }
  updateService(id, updates) {
    const srv = this.getServiceById(id);
    if (!srv) return null;
    updates.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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
          id
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] updateService error:", err));
    }
    this.persist();
    return srv;
  }
  deleteService(id) {
    if (!this.store.services) return false;
    const initialLen = this.store.services.length;
    this.store.services = this.store.services.filter((s) => s.id !== id);
    if (this.store.services.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query("DELETE FROM services WHERE id = $1", [id]).catch(
          (err) => console.warn("\u26A0\uFE0F [PostgreSQL] deleteService error:", err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }
  // ================= PRICE CATEGORIES =================
  getAllPriceCategories() {
    return [...this.store.priceCategories || []];
  }
  getPriceCategoryById(id) {
    return (this.store.priceCategories || []).find((c) => c.id === id) || null;
  }
  savePriceCategoryItem(categoryId, item) {
    let cat = (this.store.priceCategories || []).find((c) => c.id === categoryId);
    if (!cat) {
      cat = {
        id: categoryId,
        name: categoryId,
        iconName: "Layers",
        description: "",
        items: []
      };
      if (!this.store.priceCategories) this.store.priceCategories = [];
      this.store.priceCategories.push(cat);
      if (pgManager.isPgConnected()) {
        pgManager.query(
          `INSERT INTO price_categories (id, name, icon_name, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [cat.id, cat.name, cat.iconName, cat.description]
        ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] savePriceCategory error:", err));
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
          item.unit || "FCFA",
          item.popular || false,
          item.active !== false,
          item.minQty || 1
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] savePriceItem error:", err));
    }
    this.persist();
    return item;
  }
  deletePriceCategoryItem(categoryId, itemId) {
    const cat = (this.store.priceCategories || []).find((c) => c.id === categoryId);
    if (!cat || !cat.items) return false;
    const initialLen = cat.items.length;
    cat.items = cat.items.filter((i) => i.id !== itemId);
    if (cat.items.length !== initialLen) {
      if (pgManager.isPgConnected()) {
        pgManager.query("DELETE FROM prices WHERE id = $1", [itemId]).catch(
          (err) => console.warn("\u26A0\uFE0F [PostgreSQL] deletePriceItem error:", err)
        );
      }
      this.persist();
      return true;
    }
    return false;
  }
  togglePriceCategoryItem(categoryId, itemId) {
    const cat = (this.store.priceCategories || []).find((c) => c.id === categoryId);
    if (!cat || !cat.items) return null;
    const item = cat.items.find((i) => i.id === itemId);
    if (!item) return null;
    item.active = item.active === false ? true : false;
    if (pgManager.isPgConnected()) {
      pgManager.query("UPDATE prices SET active = $1, updated_at = NOW() WHERE id = $2", [item.active, itemId]).catch(
        (err) => console.warn("\u26A0\uFE0F [PostgreSQL] togglePriceCategoryItem error:", err)
      );
    }
    this.persist();
    return item;
  }
  // ================= TESTIMONIALS =================
  getAllTestimonials() {
    return [...this.store.testimonials || []];
  }
  createTestimonial(testimonialData) {
    const id = testimonialData.id || `tst-${crypto3.randomUUID().slice(0, 8)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newTestimonial = {
      ...testimonialData,
      id,
      createdAt: now
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
          newTestimonial.date || "2026",
          newTestimonial.project || null,
          true
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] createTestimonial error:", err));
    }
    this.persist();
    return newTestimonial;
  }
  // ================= AUDIT LOGS =================
  getAllAuditLogs(filter) {
    let list = [...this.store.auditLogs || []];
    if (filter) {
      if (filter.resource && filter.resource !== "ALL") {
        const resUpper = filter.resource.toUpperCase();
        list = list.filter((l) => l.resource.toUpperCase() === resUpper);
      }
      if (filter.action && filter.action !== "ALL") {
        const actUpper = filter.action.toUpperCase();
        list = list.filter((l) => l.action.toUpperCase() === actUpper);
      }
      if (filter.role && filter.role !== "ALL") {
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
          (l) => l.description.toLowerCase().includes(q) || l.username.toLowerCase().includes(q) || l.userFullName && l.userFullName.toLowerCase().includes(q) || l.resourceTitle && l.resourceTitle.toLowerCase().includes(q) || l.resourceId.toLowerCase().includes(q)
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
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter?.limit && filter.limit > 0) {
      list = list.slice(0, filter.limit);
    }
    return list;
  }
  getAuditLogById(id) {
    return (this.store.auditLogs || []).find((l) => l.id === id) || null;
  }
  createAuditLog(logData) {
    const id = logData.id || `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = logData.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    const newLog = {
      ...logData,
      id,
      createdAt: now
    };
    if (!this.store.auditLogs) this.store.auditLogs = [];
    this.store.auditLogs.unshift(newLog);
    if (this.store.auditLogs.length > 1e3) {
      this.store.auditLogs = this.store.auditLogs.slice(0, 1e3);
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
          now
        ]
      ).catch((err) => console.warn("\u26A0\uFE0F [PostgreSQL] createAuditLog error:", err));
    }
    this.persist();
    return newLog;
  }
  getAuditStats() {
    const logs = this.store.auditLogs || [];
    const totalLogs = logs.length;
    const byRole = { ADMIN: 0, EDITOR: 0, SYSTEM: 0 };
    const byAction = {};
    const byResource = {};
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
    let recentLogsCount = 0;
    for (const log of logs) {
      const role = log.role || "UNKNOWN";
      byRole[role] = (byRole[role] || 0) + 1;
      const action = log.action || "UNKNOWN";
      byAction[action] = (byAction[action] || 0) + 1;
      const resource = log.resource || "UNKNOWN";
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
      recentLogsCount
    };
  }
};
var db = new Database();

// server/services/fileManager.ts
var isVercel = !!process.env.VERCEL;
var UPLOADS_ROOT = isVercel ? path3.join(os2.tmpdir(), "uploads") : path3.join(process.cwd(), "uploads");
var QUOTES_UPLOADS_DIR = path3.join(UPLOADS_ROOT, "quotes");
var PORTFOLIO_UPLOADS_DIR = path3.join(UPLOADS_ROOT, "portfolio");
function initUploadDirectories() {
  try {
    if (!fs3.existsSync(UPLOADS_ROOT)) {
      fs3.mkdirSync(UPLOADS_ROOT, { recursive: true });
    }
    if (!fs3.existsSync(QUOTES_UPLOADS_DIR)) {
      fs3.mkdirSync(QUOTES_UPLOADS_DIR, { recursive: true });
    }
    if (!fs3.existsSync(PORTFOLIO_UPLOADS_DIR)) {
      fs3.mkdirSync(PORTFOLIO_UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("\u26A0\uFE0F [FileManager] Erreur cr\xE9ation dossiers upload:", err.message);
  }
}
initUploadDirectories();
function generateRandomFileName(originalName, prefix = "file") {
  const rawExt = path3.extname(originalName).toLowerCase();
  const safeExt = rawExt.replace(/[^a-z0-9.]/g, "");
  const timestamp = Date.now();
  const randomHex = crypto4.randomBytes(12).toString("hex");
  return `${prefix}-${timestamp}-${randomHex}${safeExt}`;
}
function deleteMulterFiles(files) {
  if (!files) return;
  const list = Array.isArray(files) ? files : Object.values(files).flat();
  for (const file of list) {
    if (file && file.path && fs3.existsSync(file.path)) {
      try {
        fs3.unlinkSync(file.path);
      } catch (err) {
        console.warn(`\u26A0\uFE0F [FileManager] Impossible de supprimer le fichier temporaire: ${file.path}`, err);
      }
    }
  }
}
function deleteQuotePhysicalFiles(files) {
  if (!files || !Array.isArray(files)) return;
  for (const f of files) {
    const filename = path3.basename(f.storedName || f.id || path3.basename(f.filePath || ""));
    if (!filename || filename === "." || filename === "..") continue;
    const fullPath = path3.resolve(QUOTES_UPLOADS_DIR, filename);
    if (fullPath.startsWith(QUOTES_UPLOADS_DIR) && fs3.existsSync(fullPath)) {
      try {
        fs3.unlinkSync(fullPath);
      } catch (err) {
        console.warn(`\u26A0\uFE0F [FileManager] Erreur suppression fichier devis: ${fullPath}`, err);
      }
    }
  }
}
function deletePortfolioPhysicalImage(imageUrlOrName) {
  if (!imageUrlOrName) return;
  const filename = path3.basename(imageUrlOrName);
  if (!filename || filename === "." || filename === "..") return;
  const fullPath = path3.resolve(PORTFOLIO_UPLOADS_DIR, filename);
  if (fullPath.startsWith(PORTFOLIO_UPLOADS_DIR) && fs3.existsSync(fullPath)) {
    try {
      fs3.unlinkSync(fullPath);
    } catch (err) {
      console.warn(`\u26A0\uFE0F [FileManager] Erreur suppression image portfolio: ${fullPath}`, err);
    }
  }
}

// server/routes/auth.ts
import { Router } from "express";

// server/middleware/rateLimiter.ts
var loginAttemptsMap = /* @__PURE__ */ new Map();
var contactSubmissionsMap = /* @__PURE__ */ new Map();
var quoteSubmissionsMap = /* @__PURE__ */ new Map();
var uploadTrackingMap = /* @__PURE__ */ new Map();
var cleanupInterval2 = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttemptsMap.entries()) {
    if (now > record.firstAttemptTime + 30 * 60 * 1e3 && now > record.blockedUntil) {
      loginAttemptsMap.delete(key);
    }
  }
  for (const [key, record] of contactSubmissionsMap.entries()) {
    if (now > record.firstAttemptTime + 30 * 60 * 1e3 && now > record.blockedUntil) {
      contactSubmissionsMap.delete(key);
    }
  }
  for (const [key, record] of quoteSubmissionsMap.entries()) {
    if (now > record.firstAttemptTime + 60 * 60 * 1e3 && now > record.blockedUntil) {
      quoteSubmissionsMap.delete(key);
    }
  }
  for (const [key, record] of uploadTrackingMap.entries()) {
    if (now > record.firstUploadTime + 30 * 60 * 1e3 && now > record.blockedUntil) {
      uploadTrackingMap.delete(key);
    }
  }
}, 10 * 60 * 1e3);
if (cleanupInterval2.unref) {
  cleanupInterval2.unref();
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "127.0.0.1";
}
var LOGIN_MAX_FAILED = 5;
var LOGIN_WINDOW_MS = 15 * 60 * 1e3;
var LOGIN_BLOCK_MS = 15 * 60 * 1e3;
function loginRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttemptsMap.get(ip);
  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1e3);
      res.status(429).json({
        success: false,
        error: `Trop de tentatives de connexion infructueuses. Veuillez patienter ${remainingSeconds} seconde(s) avant de r\xE9essayer.`,
        retryAfterSeconds: remainingSeconds,
        code: "RATE_LIMIT_LOGIN_BLOCKED"
      });
      return;
    }
    record.timestamps = record.timestamps.filter((t) => now - t < 60 * 1e3);
    if (record.timestamps.length >= 10) {
      res.status(429).json({
        success: false,
        error: "Trop de requ\xEAtes rapides. Veuillez patienter quelques instants.",
        code: "RATE_LIMIT_LOGIN_BURST"
      });
      return;
    }
    record.timestamps.push(now);
    if (now - record.firstAttemptTime > LOGIN_WINDOW_MS) {
      record.count = 0;
      record.firstAttemptTime = now;
      record.blockedUntil = 0;
    }
  } else {
    loginAttemptsMap.set(ip, {
      count: 0,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now]
    });
  }
  next();
}
function recordFailedLogin(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttemptsMap.get(ip);
  if (!record || now - record.firstAttemptTime > LOGIN_WINDOW_MS) {
    loginAttemptsMap.set(ip, {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now]
    });
  } else {
    record.count += 1;
    if (record.count >= LOGIN_MAX_FAILED) {
      record.blockedUntil = now + LOGIN_BLOCK_MS;
      console.warn(`[SECURITY] \u{1F6A8} IP ${ip} bloqu\xE9e pour ${LOGIN_BLOCK_MS / 6e4} minutes suite \xE0 ${record.count} \xE9checs de connexion.`);
    }
  }
}
function resetLoginAttempts(req) {
  const ip = getClientIp(req);
  loginAttemptsMap.delete(ip);
}
var CONTACT_MAX_SUBMISSIONS = 5;
var CONTACT_WINDOW_MS = 10 * 60 * 1e3;
var CONTACT_BLOCK_MS = 10 * 60 * 1e3;
function contactRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = contactSubmissionsMap.get(ip);
  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1e3);
      res.status(429).json({
        success: false,
        error: `Vous avez envoy\xE9 plusieurs messages r\xE9cemment. Veuillez patienter ${remainingSeconds} seconde(s) avant d'envoyer un nouveau message.`,
        retryAfterSeconds: remainingSeconds,
        code: "RATE_LIMIT_CONTACT_BLOCKED"
      });
      return;
    }
    const recent20s = record.timestamps.filter((t) => now - t < 20 * 1e3);
    if (recent20s.length >= 2) {
      res.status(429).json({
        success: false,
        error: "Veuillez patienter quelques secondes avant d\u2019envoyer un autre message.",
        code: "RATE_LIMIT_CONTACT_BURST"
      });
      return;
    }
    if (now - record.firstAttemptTime > CONTACT_WINDOW_MS) {
      record.count = 1;
      record.firstAttemptTime = now;
      record.blockedUntil = 0;
      record.timestamps = [now];
    } else {
      record.count += 1;
      record.timestamps.push(now);
      if (record.count > CONTACT_MAX_SUBMISSIONS) {
        record.blockedUntil = now + CONTACT_BLOCK_MS;
        res.status(429).json({
          success: false,
          error: `Limite de formulaires de contact atteinte. Veuillez patienter ${CONTACT_BLOCK_MS / 6e4} minutes.`,
          code: "RATE_LIMIT_CONTACT_EXCEEDED"
        });
        return;
      }
    }
  } else {
    contactSubmissionsMap.set(ip, {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now]
    });
  }
  next();
}
var QUOTES_MAX_SUBMISSIONS = 20;
var QUOTES_WINDOW_MS = 60 * 60 * 1e3;
var QUOTES_BLOCK_MS = 30 * 60 * 1e3;
function quotesRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = quoteSubmissionsMap.get(ip);
  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1e3);
      if (req.files) deleteMulterFiles(req.files);
      res.status(429).json({
        success: false,
        error: `Vous avez envoy\xE9 plusieurs demandes de devis cons\xE9cutives. Veuillez patienter ${remainingSeconds} seconde(s) avant de soumettre une nouvelle demande.`,
        retryAfterSeconds: remainingSeconds,
        code: "RATE_LIMIT_QUOTES_BLOCKED"
      });
      return;
    }
    const recent2m = record.timestamps.filter((t) => now - t < 2 * 60 * 1e3);
    if (recent2m.length >= 8) {
      if (req.files) deleteMulterFiles(req.files);
      res.status(429).json({
        success: false,
        error: "Trop de demandes de devis simultan\xE9es. Veuillez patienter 1 minute avant de recommencer.",
        code: "RATE_LIMIT_QUOTES_BURST"
      });
      return;
    }
    if (now - record.firstAttemptTime > QUOTES_WINDOW_MS) {
      record.count = 1;
      record.firstAttemptTime = now;
      record.blockedUntil = 0;
      record.timestamps = [now];
    } else {
      record.count += 1;
      record.timestamps.push(now);
      if (record.count > QUOTES_MAX_SUBMISSIONS) {
        record.blockedUntil = now + QUOTES_BLOCK_MS;
        if (req.files) deleteMulterFiles(req.files);
        res.status(429).json({
          success: false,
          error: `Limite de demandes de devis atteinte (${QUOTES_MAX_SUBMISSIONS}/heure). Veuillez nous contacter directement par t\xE9l\xE9phone ou WhatsApp.`,
          code: "RATE_LIMIT_QUOTES_EXCEEDED"
        });
        return;
      }
    }
  } else {
    quoteSubmissionsMap.set(ip, {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now]
    });
  }
  next();
}
var UPLOAD_MAX_FILES_WINDOW = 15;
var UPLOAD_MAX_BYTES_WINDOW = 150 * 1024 * 1024;
var UPLOAD_WINDOW_MS = 15 * 60 * 1e3;
function uploadAbuseLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  let incomingCount = 0;
  let incomingBytes = 0;
  if (req.files && Array.isArray(req.files)) {
    incomingCount = req.files.length;
    incomingBytes = req.files.reduce((sum, f) => sum + (f.size || 0), 0);
  } else if (req.file) {
    incomingCount = 1;
    incomingBytes = req.file.size || 0;
  }
  if (incomingCount === 0) {
    return next();
  }
  const record = uploadTrackingMap.get(ip);
  if (record) {
    if (record.blockedUntil > now) {
      if (req.files) deleteMulterFiles(req.files);
      if (req.file) deleteMulterFiles([req.file]);
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1e3);
      res.status(429).json({
        success: false,
        error: `Volume de t\xE9l\xE9versement temporairement limit\xE9. Veuillez patienter ${remainingSeconds} seconde(s).`,
        code: "RATE_LIMIT_UPLOAD_BLOCKED"
      });
      return;
    }
    if (now - record.firstUploadTime > UPLOAD_WINDOW_MS) {
      record.fileCount = incomingCount;
      record.totalBytes = incomingBytes;
      record.firstUploadTime = now;
      record.blockedUntil = 0;
    } else {
      record.fileCount += incomingCount;
      record.totalBytes += incomingBytes;
      if (record.fileCount > UPLOAD_MAX_FILES_WINDOW || record.totalBytes > UPLOAD_MAX_BYTES_WINDOW) {
        record.blockedUntil = now + 15 * 60 * 1e3;
        if (req.files) deleteMulterFiles(req.files);
        if (req.file) deleteMulterFiles([req.file]);
        res.status(429).json({
          success: false,
          error: "Limite de volume de t\xE9l\xE9versement atteinte (trop de fichiers ou volume excessif). Veuillez r\xE9essayer dans 15 minutes.",
          code: "RATE_LIMIT_UPLOAD_EXCEEDED"
        });
        return;
      }
    }
  } else {
    uploadTrackingMap.set(ip, {
      fileCount: incomingCount,
      totalBytes: incomingBytes,
      firstUploadTime: now,
      blockedUntil: 0
    });
  }
  next();
}
function honeypotBotGuard(req, res, next) {
  const {
    website_url,
    barka_hp_check,
    hp_company_field,
    _form_rendered_at
  } = req.body;
  if (website_url || barka_hp_check || hp_company_field) {
    console.warn(`[BOT DETECTED] \u{1F916} Honeypot pi\xE9g\xE9 depuis IP ${getClientIp(req)}`);
    if (req.files) deleteMulterFiles(req.files);
    if (req.file) deleteMulterFiles([req.file]);
    res.status(400).json({
      success: false,
      error: "Requ\xEAte non autoris\xE9e (protection anti-bot active).",
      code: "BOT_HONEYPOT_TRIGGERED"
    });
    return;
  }
  if (_form_rendered_at) {
    const renderTime = Number(_form_rendered_at);
    if (!isNaN(renderTime)) {
      const durationMs = Date.now() - renderTime;
      if (durationMs > 0 && durationMs < 400) {
        console.warn(`[BOT DETECTED] \u26A1 Soumission ultra-rapide (${durationMs}ms) depuis IP ${getClientIp(req)}`);
        if (req.files) deleteMulterFiles(req.files);
        if (req.file) deleteMulterFiles([req.file]);
        res.status(400).json({
          success: false,
          error: "Soumission trop rapide. Veuillez r\xE9essayer.",
          code: "BOT_SPEED_TRIGGERED"
        });
        return;
      }
    }
  }
  next();
}

// server/services/auditLogger.ts
var SENSITIVE_KEYS = /* @__PURE__ */ new Set([
  "password",
  "passwordhash",
  "password_hash",
  "passwordcurrent",
  "newpassword",
  "token",
  "rawtoken",
  "jwt",
  "jwtsecret",
  "jwt_secret",
  "secret",
  "apikey",
  "api_key",
  "smtppass",
  "smtp_pass",
  "authorization",
  "cookie",
  "barka_auth_token"
]);
function sanitizeForAudit(data) {
  if (data === null || data === void 0) {
    return data;
  }
  if (typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForAudit(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret") || lowerKey.includes("token")) {
      sanitized[key] = "[PROT\xC9G\xC9 / MASQU\xC9]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeForAudit(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
function buildAuditDescription(role, userDisplay, action, resource, resourceTitle, resourceId) {
  const actor = `${role} (${userDisplay})`;
  const target = resourceTitle ? `"${resourceTitle}"` : `#${resourceId}`;
  switch (action) {
    case "CREATE":
    case "CREATION":
      return `${actor} a cr\xE9\xE9 ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case "UPDATE":
    case "MODIFICATION":
      return `${actor} a modifi\xE9 ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case "DELETE":
    case "SUPPRESSION":
      return `${actor} a supprim\xE9 ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case "STATUS_CHANGE":
    case "CHANGEMENT_STATUT":
      return `${actor} a chang\xE9 le statut de ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case "TOGGLE_STATUS":
      return `${actor} a modifi\xE9 l'\xE9tat d'activation de ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case "LOGIN":
    case "CONNEXION":
      return `${actor} s'est connect\xE9 \xE0 l'espace d'administration.`;
    case "LOGOUT":
    case "DECONNEXION":
      return `${actor} s'est d\xE9connect\xE9.`;
    default:
      return `${actor} a effectu\xE9 l'action ${action} sur ${getResourceLabel(resource)} ${target}.`;
  }
}
function getResourceArticle(resource) {
  switch (resource.toUpperCase()) {
    case "TARIF":
    case "PORTFOLIO":
    case "DEVIS":
    case "SERVICE":
    case "MESSAGE":
    case "USER":
      return "le";
    case "COMPANY_SETTINGS":
    case "PARAMETRES":
      return "les";
    default:
      return "le";
  }
}
function getResourceLabel(resource) {
  switch (resource.toUpperCase()) {
    case "TARIF":
      return "tarif";
    case "PORTFOLIO":
      return "portfolio";
    case "DEVIS":
      return "devis";
    case "SERVICE":
      return "service";
    case "USER":
      return "compte utilisateur";
    case "COMPANY_SETTINGS":
      return "param\xE8tres d\u2019entreprise";
    case "MESSAGE":
      return "message client";
    default:
      return resource.toLowerCase();
  }
}
async function logAdminAction(params) {
  const req = params.req;
  const user = req?.user;
  const userId = params.userId || user?.id || user?.userId || "system";
  const username = params.username || user?.username || "admin";
  const userFullName = params.userFullName || user?.fullName || username;
  const role = params.role || user?.role || "ADMIN";
  const ipAddress = req?.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req?.socket?.remoteAddress || req?.ip || "127.0.0.1";
  const description = params.description || buildAuditDescription(
    role,
    userFullName || username,
    params.action,
    params.resource,
    params.resourceTitle,
    params.resourceId
  );
  const cleanOldValue = params.oldValue !== void 0 && params.oldValue !== null ? sanitizeForAudit(params.oldValue) : null;
  const cleanNewValue = params.newValue !== void 0 && params.newValue !== null ? sanitizeForAudit(params.newValue) : null;
  const newLog = db.createAuditLog({
    userId,
    username,
    userFullName,
    role,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    resourceTitle: params.resourceTitle,
    description,
    oldValue: cleanOldValue,
    newValue: cleanNewValue,
    ipAddress
  });
  console.log(`\u{1F4CB} [AUDIT LOG] ${newLog.description}`);
  return newLog;
}

// server/controllers/authController.ts
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: "Identifiant et mot de passe requis" });
      return;
    }
    const trimmedUsername = String(username).trim();
    const user = await db.findUserByUsername(trimmedUsername) || await db.findUserByEmail(trimmedUsername);
    if (!user || !user.isActive) {
      recordFailedLogin(req);
      res.status(401).json({ success: false, error: "Identifiant ou mot de passe incorrect" });
      return;
    }
    const isMatch = await comparePassword(String(password), user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(req);
      res.status(401).json({ success: false, error: "Identifiant ou mot de passe incorrect" });
      return;
    }
    resetLoginAttempts(req);
    await db.updateUserLastLogin(user.id);
    const token = generateToken(user);
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    res.cookie("barka_auth_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 8 * 3600 * 1e3,
      // 8 hours
      path: "/"
    });
    logAdminAction({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      },
      action: "LOGIN",
      resource: "USER",
      resourceId: user.id,
      resourceTitle: user.fullName || user.username,
      description: `${user.role} (${user.username}) s'est connect\xE9 \xE0 l'espace d'administration.`,
      ipAddress: req.ip || req.socket?.remoteAddress || "127.0.0.1"
    }).catch((e) => console.warn("Audit error:", e));
    const { passwordHash: _, ...safeUser } = user;
    res.json({
      success: true,
      message: "Connexion r\xE9ussie",
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}
async function getMe(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Non authentifi\xE9" });
      return;
    }
    const user = await db.findUserById(req.user.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "Utilisateur introuvable ou d\xE9sactiv\xE9" });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    next(err);
  }
}
async function logout(req, res) {
  try {
    let token = req.rawToken;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7).trim();
    }
    if (!token && req.cookies?.barka_auth_token) {
      token = req.cookies.barka_auth_token;
    }
    if (token) {
      await revokeToken(token, req.user?.id, "LOGOUT");
    }
    if (req.user) {
      logAdminAction({
        req,
        action: "LOGOUT",
        resource: "USER",
        resourceId: req.user.id,
        resourceTitle: req.user.fullName || req.user.username,
        description: `${req.user.role} (${req.user.username}) s'est d\xE9connect\xE9.`
      }).catch((e) => console.warn("Audit error:", e));
    }
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    res.clearCookie("barka_auth_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/"
    });
    res.json({
      success: true,
      message: "D\xE9connexion effectu\xE9e avec succ\xE8s. Session invalid\xE9e."
    });
  } catch {
    res.json({
      success: true,
      message: "D\xE9connexion effectu\xE9e."
    });
  }
}
async function listUsers(_req, res, next) {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}
async function createUser(req, res, next) {
  try {
    const { username, email, password, fullName, role } = req.body;
    if (!username || !email || !password || !fullName) {
      res.status(400).json({ success: false, error: "Tous les champs sont requis (nom d\u2019utilisateur, email, mot de passe, nom complet)" });
      return;
    }
    const passwordStr = String(password);
    const pwdValidation = isStrongPassword(passwordStr);
    if (!pwdValidation.valid) {
      res.status(400).json({ success: false, error: pwdValidation.reason || "Le mot de passe ne respecte pas les crit\xE8res de s\xE9curit\xE9" });
      return;
    }
    const existingUser = await db.findUserByUsername(String(username).trim());
    if (existingUser) {
      res.status(409).json({ success: false, error: "Nom d\u2019utilisateur d\xE9j\xE0 existant" });
      return;
    }
    const existingEmail = await db.findUserByEmail(String(email).trim());
    if (existingEmail) {
      res.status(409).json({ success: false, error: "Adresse email d\xE9j\xE0 utilis\xE9e par un autre compte" });
      return;
    }
    const passwordHash = await hashPassword(String(password));
    const assignedRole = role === "ADMIN" ? "ADMIN" : "EDITOR";
    const newUser = await db.createUser({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      fullName: String(fullName).trim(),
      role: assignedRole,
      isActive: true
    });
    logAdminAction({
      req,
      action: "CREATE",
      resource: "USER",
      resourceId: newUser.id,
      resourceTitle: newUser.fullName,
      description: `${req.user?.role || "ADMIN"} a cr\xE9\xE9 le compte utilisateur (${newUser.username} - r\xF4le ${assignedRole}).`,
      oldValue: null,
      newValue: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      }
    }).catch((e) => console.warn("Audit error:", e));
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, message: `Utilisateur avec r\xF4le ${assignedRole} cr\xE9\xE9 avec succ\xE8s`, data: safeUser });
  } catch (err) {
    next(err);
  }
}
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      res.status(400).json({ success: false, error: "S\xE9curit\xE9 : Vous ne pouvez pas supprimer votre propre compte administrateur actif." });
      return;
    }
    const targetUser = await db.findUserById(id);
    const deleted = await db.deleteUser(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Utilisateur introuvable" });
      return;
    }
    logAdminAction({
      req,
      action: "DELETE",
      resource: "USER",
      resourceId: id,
      resourceTitle: targetUser?.fullName || id,
      description: `${req.user?.role || "ADMIN"} a supprim\xE9 le compte utilisateur (${targetUser?.username || id}).`,
      oldValue: targetUser ? { id: targetUser.id, username: targetUser.username, role: targetUser.role } : null,
      newValue: null
    }).catch((e) => console.warn("Audit error:", e));
    res.json({ success: true, message: "Utilisateur supprim\xE9 avec succ\xE8s" });
  } catch (err) {
    next(err);
  }
}

// server/middleware/authMiddleware.ts
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  if (req.cookies && req.cookies.barka_auth_token) {
    return req.cookies.barka_auth_token;
  }
  const rawCookies = req.headers.cookie;
  if (rawCookies) {
    const match = rawCookies.match(/(?:^|;\s*)barka_auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}
async function authenticateJWT(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentification requise. Veuillez vous connecter.",
      code: "AUTH_REQUIRED"
    });
    return;
  }
  const isRevoked = await isTokenRevokedAsync(token);
  if (isRevoked) {
    res.status(401).json({
      success: false,
      error: "Cette session a \xE9t\xE9 r\xE9voqu\xE9e suite \xE0 une d\xE9connexion. Veuillez vous reconnecter.",
      code: "SESSION_REVOKED"
    });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: "Session expir\xE9e ou jeton d\u2019authentification invalide. Veuillez vous reconnecter.",
      code: "TOKEN_INVALID_OR_EXPIRED"
    });
    return;
  }
  try {
    const userInDb = await db.findUserById(payload.id);
    if (!userInDb || userInDb.isActive === false) {
      res.status(401).json({
        success: false,
        error: "Compte utilisateur introuvable ou d\xE9sactiv\xE9. Veuillez vous reconnecter.",
        code: "USER_NOT_FOUND_OR_INACTIVE"
      });
      return;
    }
    payload.role = userInDb.role;
    req.user = payload;
    req.rawToken = token;
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la validation du compte utilisateur.",
      code: "AUTH_DB_ERROR"
    });
  }
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Non authentifi\xE9. Veuillez vous connecter.",
        code: "AUTH_REQUIRED"
      });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Acc\xE8s interdit. Vos privil\xE8ges de compte (${req.user.role}) ne vous autorisent pas \xE0 effectuer cette action. R\xF4le(s) requis : ${allowedRoles.join(", ")}`,
        code: "FORBIDDEN_INSUFFICIENT_PERMISSIONS",
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      return;
    }
    next();
  };
}

// server/middleware/validationMiddleware.ts
var PHONE_REGEX = /^(?:\+237|237)?[2368]\d{8}$|^(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})$/;
var EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function sanitizeString(val) {
  if (val === null || val === void 0) return "";
  return String(val).replace(/[<>]/g, "").trim();
}
function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}
function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.-]/g, "");
  return cleaned.length >= 8 && PHONE_REGEX.test(phone.trim());
}
function validateQuoteInput(req, res, next) {
  const fail = (status, message, field) => {
    if (req.files) {
      deleteMulterFiles(req.files);
    }
    res.status(status).json({
      success: false,
      error: message,
      ...field ? { field } : {}
    });
  };
  const {
    nom,
    prenom,
    nomComplet,
    telephone,
    email,
    service,
    typePrestation,
    quantite,
    format,
    finition,
    description,
    delai
  } = req.body;
  const rawNom = sanitizeString(nom);
  const rawPrenom = sanitizeString(prenom);
  const finalNomComplet = sanitizeString(nomComplet) || `${rawPrenom} ${rawNom}`.trim() || rawNom;
  if (!finalNomComplet || finalNomComplet.length < 2) {
    fail(400, "Veuillez renseigner votre nom complet (au moins 2 caract\xE8res).", "nom");
    return;
  }
  if (finalNomComplet.length > 100) {
    fail(400, "Le nom renseign\xE9 est trop long (maximum 100 caract\xE8res).", "nom");
    return;
  }
  const rawPhone = sanitizeString(telephone);
  if (!rawPhone) {
    fail(400, "Le num\xE9ro de t\xE9l\xE9phone est obligatoire.", "telephone");
    return;
  }
  if (!isValidPhone(rawPhone)) {
    fail(400, "Veuillez saisir un num\xE9ro de t\xE9l\xE9phone valide (ex: +237 696 31 11 98).", "telephone");
    return;
  }
  const rawEmail = sanitizeString(email);
  if (rawEmail) {
    if (!isValidEmail(rawEmail)) {
      fail(400, "L\u2019adresse e-mail renseign\xE9e est invalide.", "email");
      return;
    }
    if (rawEmail.length > 120) {
      fail(400, "L\u2019adresse e-mail est trop longue (maximum 120 caract\xE8res).", "email");
      return;
    }
  }
  const rawPrestation = sanitizeString(typePrestation || service);
  if (!rawPrestation || rawPrestation.length < 2) {
    fail(400, "Veuillez s\xE9lectionner un service ou type de prestation.", "typePrestation");
    return;
  }
  if (rawPrestation.length > 150) {
    fail(400, "Le type de prestation est trop long.", "typePrestation");
    return;
  }
  if (quantite === void 0 || quantite === null || String(quantite).trim() === "") {
    fail(400, "La quantit\xE9 demand\xE9e est obligatoire et doit \xEAtre sup\xE9rieure ou \xE9gale \xE0 1.", "quantite");
    return;
  }
  const qty = Number(quantite);
  if (isNaN(qty) || !Number.isInteger(qty) || qty < 1 || qty > 1e7) {
    fail(400, "La quantit\xE9 demand\xE9e doit \xEAtre un nombre entier positif sup\xE9rieur \xE0 0 (max 10 000 000).", "quantite");
    return;
  }
  const rawFormat = sanitizeString(format);
  if (rawFormat.length > 100) {
    fail(400, "Le format renseign\xE9 est trop long (maximum 100 caract\xE8res).", "format");
    return;
  }
  const rawFinition = sanitizeString(finition);
  if (rawFinition.length > 150) {
    fail(400, "La finition renseign\xE9e est trop longue (maximum 150 caract\xE8res).", "finition");
    return;
  }
  const rawDescription = sanitizeString(description);
  if (rawDescription.length > 2e3) {
    fail(400, "La description ne doit pas d\xE9passer 2000 caract\xE8res.", "description");
    return;
  }
  const rawDelai = sanitizeString(delai);
  if (rawDelai.length > 100) {
    fail(400, "Le d\xE9lai renseign\xE9 est trop long (maximum 100 caract\xE8res).", "delai");
    return;
  }
  if (req.files && Array.isArray(req.files)) {
    if (req.files.length > 5) {
      fail(400, "Vous ne pouvez pas joindre plus de 5 fichiers.", "files");
      return;
    }
    for (const file of req.files) {
      if (file.size > 50 * 1024 * 1024) {
        fail(400, `Le fichier "${file.originalname}" d\xE9passe la taille maximale autoris\xE9e de 50 Mo.`, "files");
        return;
      }
    }
  }
  next();
}
function validateContactInput(req, res, next) {
  const { name, emailOrPhone, message } = req.body;
  const rawName = sanitizeString(name);
  const rawContact = sanitizeString(emailOrPhone);
  const rawMessage = sanitizeString(message);
  if (!rawName || rawName.length < 2) {
    res.status(400).json({
      success: false,
      error: "Veuillez renseigner votre nom (au moins 2 caract\xE8res)."
    });
    return;
  }
  if (!rawContact) {
    res.status(400).json({
      success: false,
      error: "Veuillez renseigner un num\xE9ro de t\xE9l\xE9phone ou une adresse e-mail de contact."
    });
    return;
  }
  if (!isValidPhone(rawContact) && !isValidEmail(rawContact)) {
    res.status(400).json({
      success: false,
      error: "Veuillez saisir un num\xE9ro de t\xE9l\xE9phone ou un e-mail valide pour \xEAtre recontact\xE9."
    });
    return;
  }
  if (!rawMessage || rawMessage.length < 5) {
    res.status(400).json({
      success: false,
      error: "Veuillez r\xE9diger un message de description d\u2019au moins 5 caract\xE8res."
    });
    return;
  }
  next();
}
function validateLoginInput(req, res, next) {
  const { username, password } = req.body;
  const rawUser = sanitizeString(username);
  const rawPass = typeof password === "string" ? password : "";
  if (!rawUser || !rawPass) {
    res.status(400).json({
      success: false,
      error: "Identifiant et mot de passe obligatoires."
    });
    return;
  }
  next();
}
function validatePricingInput(req, res, next) {
  const { quantite, typePrestation } = req.body;
  if (quantite !== void 0 && quantite !== null && String(quantite).trim() !== "") {
    const qty = Number(quantite);
    if (!Number.isFinite(qty) || isNaN(qty) || !Number.isInteger(qty) || qty < 1 || qty > 1e7) {
      res.status(400).json({
        success: false,
        error: "La quantit\xE9 demand\xE9e doit \xEAtre un nombre entier positif sup\xE9rieur \xE0 0 (max 10 000 000).",
        field: "quantite"
      });
      return;
    }
  }
  if (typePrestation !== void 0 && typePrestation !== null) {
    const rawPrestation = sanitizeString(typePrestation);
    if (rawPrestation.length > 150) {
      res.status(400).json({
        success: false,
        error: "Le type de prestation est trop long (max 150 caract\xE8res).",
        field: "typePrestation"
      });
      return;
    }
  }
  next();
}

// server/routes/auth.ts
var authRouter = Router();
authRouter.post("/login", loginRateLimiter, validateLoginInput, login);
authRouter.get("/me", authenticateJWT, getMe);
authRouter.post("/logout", logout);
authRouter.get("/users", authenticateJWT, requireRole(["ADMIN"]), listUsers);
authRouter.post("/users", authenticateJWT, requireRole(["ADMIN"]), createUser);
authRouter.delete("/users/:id", authenticateJWT, requireRole(["ADMIN"]), deleteUser);

// server/routes/company.ts
import { Router as Router2 } from "express";

// server/services/mailer.ts
import nodemailer from "nodemailer";
var EMAIL_REGEX2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function getAdminEmails() {
  const mandatoryAdmins = ["direction@barkasolutions.org", "kouchoumichel@yahoo.fr"];
  const envAdmins = process.env.ADMIN_NOTIFICATION_EMAILS;
  if (!envAdmins) {
    return mandatoryAdmins;
  }
  const parsed = envAdmins.split(",").map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_REGEX2.test(e) && !e.includes("mondomaine.com") && !e.includes("example.com"));
  const combined = Array.from(/* @__PURE__ */ new Set([...mandatoryAdmins, ...parsed]));
  return combined;
}
function getMailerConfig() {
  const adminEmails = getAdminEmails();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "direction@barkasolutions.org";
  const fromName = process.env.SMTP_FROM_NAME || "BARKA SOLUTIONS S.A.S";
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "") {
    return {
      provider: "resend",
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true
    };
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== "" || process.env.SIB_API_KEY && process.env.SIB_API_KEY.trim() !== "") {
    return {
      provider: "brevo",
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true
    };
  }
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== "") {
    return {
      provider: "sendgrid",
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true
    };
  }
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_API_KEY.trim() !== "" && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_DOMAIN.trim() !== "") {
    return {
      provider: "mailgun",
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true
    };
  }
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (smtpHost && (smtpUser || smtpPass)) {
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
    return {
      provider: "smtp",
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      hasSmtpPass: Boolean(smtpPass)
    };
  }
  return {
    provider: "none",
    isConfigured: false,
    fromName,
    fromEmail,
    adminEmails
  };
}
function createSmtpTransporter() {
  const config = getMailerConfig();
  if (config.provider !== "smtp" || !config.smtpHost) {
    return null;
  }
  const auth = config.smtpUser ? {
    user: config.smtpUser,
    pass: process.env.SMTP_PASS || ""
  } : void 0;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: config.smtpSecure || false,
    auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production"
    },
    connectionTimeout: 1e4,
    greetingTimeout: 1e4,
    socketTimeout: 15e3
  });
}
function normalizeRecipients(to) {
  const rawList = Array.isArray(to) ? to : to.split(",");
  return rawList.map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_REGEX2.test(e));
}
function formatFromHeader(config) {
  const fromAddr = process.env.SMTP_FROM || `"${config.fromName}" <${config.fromEmail}>`;
  return fromAddr;
}
async function sendViaResend(options, recipients, config) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      sent: false,
      provider: "resend",
      recipients,
      accepted: [],
      rejected: recipients,
      error: "Cl\xE9 API Resend manquante (RESEND_API_KEY)."
    };
  }
  const from = formatFromHeader(config);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Erreur HTTP ${res.status} lors de l\u2019envoi via Resend`;
    console.error(`[MAILER] \u274C \xC9chec Resend (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: "resend",
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg
    };
  }
  console.log(`[MAILER] \u2705 Email envoy\xE9 avec succ\xE8s via Resend (ID: ${data.id}) \xE0 ${recipients.join(", ")}`);
  return {
    success: true,
    sent: true,
    provider: "resend",
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: data.id
  };
}
async function sendViaBrevo(options, recipients, config) {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SIB_API_KEY)?.trim();
  if (!apiKey) {
    return {
      success: false,
      sent: false,
      provider: "brevo",
      recipients,
      accepted: [],
      rejected: recipients,
      error: "Cl\xE9 API Brevo manquante (BREVO_API_KEY ou SIB_API_KEY)."
    };
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: config.fromName,
        email: config.fromEmail
      },
      to: recipients.map((email) => ({ email })),
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
      replyTo: options.replyTo ? { email: options.replyTo } : void 0
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Erreur HTTP ${res.status} lors de l\u2019envoi via Brevo`;
    console.error(`[MAILER] \u274C \xC9chec Brevo (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: "brevo",
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg
    };
  }
  console.log(`[MAILER] \u2705 Email envoy\xE9 avec succ\xE8s via Brevo (ID: ${data.messageId}) \xE0 ${recipients.join(", ")}`);
  return {
    success: true,
    sent: true,
    provider: "brevo",
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: data.messageId
  };
}
async function sendViaSendGrid(options, recipients, config) {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      sent: false,
      provider: "sendgrid",
      recipients,
      accepted: [],
      rejected: recipients,
      error: "Cl\xE9 API SendGrid manquante (SENDGRID_API_KEY)."
    };
  }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: recipients.map((email) => ({ email }))
        }
      ],
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      subject: options.subject,
      content: [
        {
          type: "text/html",
          value: options.html
        }
      ],
      reply_to: options.replyTo ? { email: options.replyTo } : void 0
    })
  });
  if (!res.ok && res.status !== 202) {
    const data = await res.json().catch(() => ({}));
    const errorMsg = data.errors && data.errors[0]?.message || `Erreur HTTP ${res.status} SendGrid`;
    console.error(`[MAILER] \u274C \xC9chec SendGrid (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: "sendgrid",
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg
    };
  }
  console.log(`[MAILER] \u2705 Email envoy\xE9 avec succ\xE8s via SendGrid \xE0 ${recipients.join(", ")}`);
  return {
    success: true,
    sent: true,
    provider: "sendgrid",
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: `sendgrid-${Date.now()}`
  };
}
async function sendViaMailgun(options, recipients, config) {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  if (!apiKey || !domain) {
    return {
      success: false,
      sent: false,
      provider: "mailgun",
      recipients,
      accepted: [],
      rejected: recipients,
      error: "Configuration Mailgun incompl\xE8te (MAILGUN_API_KEY et MAILGUN_DOMAIN requis)."
    };
  }
  const formData = new URLSearchParams();
  formData.append("from", formatFromHeader(config));
  recipients.forEach((r) => formData.append("to", r));
  formData.append("subject", options.subject);
  formData.append("html", options.html);
  if (options.text) formData.append("text", options.text);
  if (options.replyTo) formData.append("h:Reply-To", options.replyTo);
  const authHeader = Buffer.from(`api:${apiKey}`).toString("base64");
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Erreur HTTP ${res.status} Mailgun`;
    console.error(`[MAILER] \u274C \xC9chec Mailgun (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: "mailgun",
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg
    };
  }
  console.log(`[MAILER] \u2705 Email envoy\xE9 avec succ\xE8s via Mailgun (ID: ${data.id}) \xE0 ${recipients.join(", ")}`);
  return {
    success: true,
    sent: true,
    provider: "mailgun",
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: data.id
  };
}
async function sendViaSmtp(options, recipients, config) {
  const transporter = createSmtpTransporter();
  if (!transporter) {
    return {
      success: false,
      sent: false,
      provider: "smtp",
      recipients,
      accepted: [],
      rejected: recipients,
      error: "Impossible d\u2019initialiser le transporteur SMTP (v\xE9rifiez les variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)."
    };
  }
  try {
    const from = formatFromHeader(config);
    const info = await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments
    });
    const accepted = Array.isArray(info.accepted) ? info.accepted : recipients;
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];
    if (accepted.length === 0 && rejected.length > 0) {
      return {
        success: false,
        sent: false,
        provider: "smtp",
        recipients,
        accepted: [],
        rejected,
        error: "Tous les destinataires ont \xE9t\xE9 rejet\xE9s par le serveur SMTP."
      };
    }
    console.log(`[MAILER] \u2705 Email envoy\xE9 avec succ\xE8s via SMTP (${config.smtpHost}) (ID: ${info.messageId}) \xE0 ${recipients.join(", ")}`);
    return {
      success: true,
      sent: true,
      provider: "smtp",
      recipients,
      accepted,
      rejected,
      messageId: info.messageId
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue lors de la transmission SMTP";
    console.error(`[MAILER] \u274C \xC9chec envoi SMTP (${config.smtpHost}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: "smtp",
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg
    };
  }
}
async function sendEmail(options) {
  const sanitizedSubject = (options.subject || "").replace(/[\r\n\t]/g, " ").trim();
  const safeOptions = {
    ...options,
    subject: sanitizedSubject
  };
  const recipients = normalizeRecipients(safeOptions.to);
  if (recipients.length === 0) {
    return {
      success: false,
      sent: false,
      provider: "none",
      recipients: [],
      accepted: [],
      rejected: [],
      error: "Aucune adresse e-mail destinataire valide fournie."
    };
  }
  const config = getMailerConfig();
  if (!config.isConfigured || config.provider === "none") {
    const warnMsg = "Service d\u2019envoi d\u2019emails non configur\xE9 (SMTP, Brevo, Resend, SendGrid ou Mailgun).";
    console.warn(`[MAILER] \u26A0\uFE0F ${warnMsg} Notification non \xE9mise pour : ${recipients.join(", ")}`);
    return {
      success: false,
      sent: false,
      provider: "none",
      recipients,
      accepted: [],
      rejected: recipients,
      error: warnMsg
    };
  }
  try {
    switch (config.provider) {
      case "resend":
        return await sendViaResend(safeOptions, recipients, config);
      case "brevo":
        return await sendViaBrevo(safeOptions, recipients, config);
      case "sendgrid":
        return await sendViaSendGrid(safeOptions, recipients, config);
      case "mailgun":
        return await sendViaMailgun(safeOptions, recipients, config);
      case "smtp":
      default:
        return await sendViaSmtp(safeOptions, recipients, config);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inattendue lors de l\u2019envoi de l\u2019email";
    console.error("[MAILER] \u274C Erreur critique service email:", errorMsg);
    return {
      success: false,
      sent: false,
      provider: config.provider,
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg
    };
  }
}
function buildAdminQuoteEmailHtml(quote) {
  const fileListHtml = quote.files && quote.files.length > 0 ? quote.files.map(
    (f) => `<li>\u{1F4CE} <strong>${f.originalName}</strong> (${Math.round(f.fileSize / 1024)} Ko)</li>`
  ).join("") : "<li><em>Aucun fichier joint</em></li>";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { background: #0010c2; color: #ffffff; padding: 28px 32px; border-bottom: 4px solid #d97706; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .content { padding: 32px; }
    .badge-ref { display: inline-block; background: #fef3c7; color: #92400e; font-weight: 700; padding: 4px 12px; border-radius: 6px; font-size: 14px; margin-bottom: 20px; border: 1px solid #fde68a; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
    .table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .table td.label { font-weight: 600; color: #475569; width: 35%; background: #f8fafc; }
    .table td.value { color: #0f172a; font-weight: 500; }
    .price-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 24px; text-align: right; margin-top: 20px; }
    .price-box .amount { font-size: 24px; font-weight: 800; color: #0010c2; }
    .price-box .disclaimer { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px 32px; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BARKA SOLUTIONS S.A.S \u2014 Nouvelle demande de devis</h1>
      <p>Notification de devis g\xE9n\xE9r\xE9e par la plateforme web</p>
    </div>
    <div class="content">
      <span class="badge-ref">R\xC9F\xC9RENCE : ${quote.id}</span>

      <h3 style="color: #0010c2; margin-top: 0;">1. Coordonn\xE9es du Client</h3>
      <table class="table">
        <tr><td class="label">Nom complet</td><td class="value">${quote.nomComplet}</td></tr>
        <tr><td class="label">Entreprise</td><td class="value">${quote.entreprise || "Particulier"}</td></tr>
        <tr><td class="label">T\xE9l\xE9phone</td><td class="value"><strong>${quote.telephone}</strong></td></tr>
        <tr><td class="label">E-mail</td><td class="value">${quote.email || "Non renseign\xE9"}</td></tr>
        <tr><td class="label">Ville</td><td class="value">${quote.ville}</td></tr>
      </table>

      <h3 style="color: #0010c2;">2. D\xE9tails techniques du projet</h3>
      <table class="table">
        <tr><td class="label">Prestation / Produit</td><td class="value"><strong>${quote.typePrestation}</strong> ${quote.produit ? `\u2014 ${quote.produit}` : ""}</td></tr>
        <tr><td class="label">Quantit\xE9</td><td class="value"><strong>${quote.quantite} exemplaires</strong></td></tr>
        <tr><td class="label">Format</td><td class="value">${quote.format}</td></tr>
        <tr><td class="label">Support / Papier</td><td class="value">${quote.supportPapier || "Standard"} ${quote.grammage ? `(${quote.grammage})` : ""}</td></tr>
        <tr><td class="label">Impression</td><td class="value">${quote.impressionType || "Recto seul"}</td></tr>
        <tr><td class="label">Finition</td><td class="value">${quote.finition}</td></tr>
        <tr><td class="label">D\xE9lai souhait\xE9</td><td class="value">${quote.delai}</td></tr>
        <tr><td class="label">Livraison</td><td class="value">${quote.livraisonOption || "Retrait en agence"}</td></tr>
        <tr><td class="label">Graphisme</td><td class="value">${quote.graphismeOption || "Fichier pr\xEAt fourni"}</td></tr>
        <tr><td class="label">Description / Note</td><td class="value">${quote.description || "Aucune"}</td></tr>
      </table>

      <h3 style="color: #0010c2;">3. Fichiers & Pi\xE8ces jointes</h3>
      <ul style="padding-left: 20px; color: #334155; font-size: 14px;">
        ${fileListHtml}
      </ul>

      <div class="price-box">
        <span style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #64748b;">Estimation Indicative Web</span>
        <div class="amount">${(quote.estimatedPrice || 0).toLocaleString("fr-FR")} FCFA</div>
        <div class="disclaimer">Le prix d\xE9finitif sera confirm\xE9 apr\xE8s contr\xF4le PAO et validation BAT.</div>
      </div>
    </div>
    <div class="footer">
      BARKA SOLUTIONS S.A.S \u2014 ${DEFAULT_COMPANY_SETTINGS.address}<br>
      T\xE9l : ${DEFAULT_COMPANY_SETTINGS.phone_primary} | WhatsApp : ${DEFAULT_COMPANY_SETTINGS.whatsapp}
    </div>
  </div>
</body>
</html>
  `;
}
function buildClientConfirmationEmailHtml(quote) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0010c2; color: #ffffff; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 32px; }
    .ref-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .btn-wa { display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; margin-top: 15px; }
    .footer { background: #f1f5f9; padding: 20px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BARKA SOLUTIONS S.A.S</h1>
      <p style="margin: 4px 0 0; color: #cbd5e1; font-size: 13px;">${DEFAULT_COMPANY_SETTINGS.slogan}</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${quote.nomComplet}</strong>,</p>
      <p>Nous avons bien re\xE7u votre demande de devis et nous vous remercions de votre confiance.</p>
      
      <div class="ref-card">
        <div style="font-size: 13px; color: #166534; font-weight: 600;">VOTRE NUM\xC9RO DE R\xC9F\xC9RENCE</div>
        <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 4px;">${quote.id}</div>
      </div>

      <p><strong>R\xE9capitulatif de votre projet :</strong></p>
      <ul style="line-height: 1.8; font-size: 14px; color: #334155;">
        <li><strong>Prestation :</strong> ${quote.typePrestation}</li>
        <li><strong>Quantit\xE9 :</strong> ${quote.quantite} ex.</li>
        <li><strong>Format :</strong> ${quote.format}</li>
        <li><strong>Finition :</strong> ${quote.finition}</li>
        <li><strong>D\xE9lai souhait\xE9 :</strong> ${quote.delai}</li>
        <li><strong>Estimation indicative :</strong> ${(quote.estimatedPrice || 0).toLocaleString("fr-FR")} FCFA</li>
      </ul>

      <p style="font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #0010c2;">
        \u2139\uFE0F <em>Le prix d\xE9finitif sera confirm\xE9 par nos techniciens apr\xE8s v\xE9rification de vos fichiers et contraintes de fabrication.</em>
      </p>

      <div style="text-align: center; margin-top: 25px;">
        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;">Pour un traitement prioritaire, \xE9crivez-nous sur WhatsApp :</p>
        <a href="https://wa.me/${DEFAULT_COMPANY_SETTINGS.whatsapp_raw}?text=Bonjour%20BARKA%20SOLUTIONS%2C%20je%20suis%20${encodeURIComponent(quote.nomComplet)}%20(R%C3%A9f%20%3A%20${quote.id})" class="btn-wa">
          Contacter notre \xE9quipe sur WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      ${DEFAULT_COMPANY_SETTINGS.company_name} \u2014 ${DEFAULT_COMPANY_SETTINGS.address}<br>
      T\xE9l : ${DEFAULT_COMPANY_SETTINGS.phone_primary} | Email : ${DEFAULT_COMPANY_SETTINGS.email_primary}
    </div>
  </div>
</body>
</html>
  `;
}
function buildAdminContactEmailHtml(message) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { background: #0010c2; color: #ffffff; padding: 24px 32px; }
    .content { padding: 32px; }
    .msg-box { background: #f8fafc; border-left: 4px solid #0010c2; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 15px; line-height: 1.6; color: #334155; }
    .footer { background: #0f172a; color: #94a3b8; padding: 18px 32px; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">Nouveau message de contact \u2014 BARKA SOLUTIONS</h2>
      <p style="margin: 4px 0 0; color: #cbd5e1; font-size: 13px;">Message envoy\xE9 depuis le formulaire web</p>
    </div>
    <div class="content">
      <p><strong>Exp\xE9diteur :</strong> ${message.name}</p>
      <p><strong>Contact :</strong> <strong>${message.emailOrPhone}</strong></p>
      <p><strong>Objet :</strong> ${message.subject || "Demande d\u2019information"}</p>
      <div class="msg-box">
        ${message.message.replace(/\n/g, "<br>")}
      </div>
      <p style="font-size: 12px; color: #64748b;">Re\xE7u le : ${(/* @__PURE__ */ new Date()).toLocaleString("fr-FR")}</p>
    </div>
    <div class="footer">
      BARKA SOLUTIONS S.A.S \u2014 Plateforme Web
    </div>
  </div>
</body>
</html>
  `;
}
async function sendQuoteNotifications(quote) {
  const adminRecipients = getAdminEmails();
  const adminSubject = `[NOUVEAU DEVIS] ${quote.id} \u2014 ${quote.nomComplet} (${quote.typePrestation})`;
  const adminHtml = buildAdminQuoteEmailHtml(quote);
  const adminResult = await sendEmail({
    to: adminRecipients,
    subject: adminSubject,
    html: adminHtml,
    replyTo: quote.email && EMAIL_REGEX2.test(quote.email) ? quote.email : void 0
  });
  const sentToAdmin = adminResult.sent === true;
  let sentToClient = false;
  let clientResult;
  const clientEmail = quote.email ? quote.email.trim().toLowerCase() : "";
  if (clientEmail && EMAIL_REGEX2.test(clientEmail)) {
    const clientSubject = `Votre demande de devis BARKA SOLUTIONS S.A.S (${quote.id})`;
    const clientHtml = buildClientConfirmationEmailHtml(quote);
    clientResult = await sendEmail({
      to: clientEmail,
      subject: clientSubject,
      html: clientHtml
    });
    sentToClient = clientResult.sent === true;
  }
  const overallSuccess = sentToAdmin;
  return {
    success: overallSuccess,
    sentToAdmin,
    sentToClient,
    adminRecipients,
    clientRecipient: clientEmail || void 0,
    adminResult,
    clientResult,
    error: adminResult.error || (clientResult && !clientResult.sent ? clientResult.error : void 0)
  };
}
async function sendContactNotification(message) {
  const adminRecipients = getAdminEmails();
  const adminSubject = `[CONTACT WEB] ${message.subject || "Nouveau message"} \u2014 ${message.name}`;
  const adminHtml = buildAdminContactEmailHtml(message);
  const replyTo = message.emailOrPhone && EMAIL_REGEX2.test(message.emailOrPhone.trim()) ? message.emailOrPhone.trim() : void 0;
  const adminResult = await sendEmail({
    to: adminRecipients,
    subject: adminSubject,
    html: adminHtml,
    replyTo
  });
  const sentToAdmin = adminResult.sent === true;
  return {
    success: sentToAdmin,
    sentToAdmin,
    sentToClient: false,
    adminRecipients,
    adminResult,
    error: adminResult.error
  };
}
async function testEmailDelivery(targetRecipient) {
  const config = getMailerConfig();
  const target = targetRecipient && EMAIL_REGEX2.test(targetRecipient.trim()) ? targetRecipient.trim() : config.adminEmails[0] || "direction@barkasolutions.org";
  const subject = `[TEST SYST\xC8ME] V\xE9rification de l\u2019envoi d\u2019emails BARKA SOLUTIONS (${config.provider.toUpperCase()})`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
  <div style="max-width: 550px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h2 style="color: #0010c2; margin-top: 0;">Test d\u2019envoi d\u2019emails r\xE9ussi !</h2>
    <p>Ce message confirme que la passerelle d\u2019emails de <strong>BARKA SOLUTIONS S.A.S</strong> fonctionne correctement.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      <tr><td style="padding: 6px 0; color: #64748b;">Fournisseur actif :</td><td><strong>${config.provider.toUpperCase()}</strong></td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Exp\xE9diteur :</td><td>${formatFromHeader(config)}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Date & Heure :</td><td>${(/* @__PURE__ */ new Date()).toLocaleString("fr-FR")}</td></tr>
    </table>
  </div>
</body>
</html>
  `;
  return await sendEmail({
    to: target,
    subject,
    html
  });
}

// server/controllers/companyController.ts
function getCompanySettings(_req, res, next) {
  try {
    const settings = db.getCompanySettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
}
function updateCompanySettings(req, res, next) {
  try {
    const oldSettings = db.getCompanySettings();
    const allowedKeys = [
      "company_name",
      "legal_name",
      "slogan",
      "description",
      "niu",
      "rccm",
      "address_line1",
      "address_line2",
      "city",
      "region",
      "country",
      "quarter",
      "landmarks",
      "phone_primary",
      "phone_secondary",
      "phone_workshop",
      "whatsapp_number",
      "email_primary",
      "email_quote",
      "email_support",
      "opening_hours_weekday",
      "opening_hours_saturday",
      "opening_hours_sunday",
      "emergency_service",
      "turnaround_standard",
      "turnaround_express",
      "currency",
      "social_facebook",
      "social_instagram",
      "social_linkedin",
      "social_twitter",
      "gps_latitude",
      "gps_longitude",
      "google_maps_url"
    ];
    const cleanPayload = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== void 0) {
        cleanPayload[key] = req.body[key];
      }
    }
    const updated = db.updateCompanySettings(cleanPayload);
    logAdminAction({
      req,
      action: "UPDATE",
      resource: "COMPANY_SETTINGS",
      resourceId: "barka-settings",
      resourceTitle: updated.company_name || updated.legal_name || "BARKA SOLUTIONS S.A.S",
      description: `${req.user?.role || "ADMIN"} a modifi\xE9 les coordonn\xE9es et param\xE8tres de l'entreprise.`,
      oldValue: oldSettings,
      newValue: updated
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: "Coordonn\xE9es et param\xE8tres mis \xE0 jour",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}
function getMailerStatus(_req, res, next) {
  try {
    const config = getMailerConfig();
    res.json({
      success: true,
      data: {
        provider: config.provider,
        isConfigured: config.isConfigured,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        adminEmails: config.adminEmails,
        smtpHost: config.smtpHost || null,
        smtpPort: config.smtpPort || null,
        smtpSecure: config.smtpSecure || false,
        smtpUser: config.smtpUser || null,
        hasSmtpPass: config.hasSmtpPass || false,
        hasApiKey: config.hasApiKey || false
      }
    });
  } catch (err) {
    next(err);
  }
}
async function triggerTestEmail(req, res, next) {
  try {
    const { targetEmail } = req.body;
    const result = await testEmailDelivery(targetEmail ? String(targetEmail).trim() : void 0);
    if (result.sent) {
      logAdminAction({
        req,
        action: "EMAIL_SENT",
        resource: "COMPANY_SETTINGS",
        resourceId: "mailer-test",
        resourceTitle: "Test Service Email",
        description: `${req.user?.role || "ADMIN"} a d\xE9clench\xE9 un test d'envoi d'email vers ${result.recipients.join(", ")}.`,
        oldValue: null,
        newValue: { provider: result.provider, recipients: result.recipients }
      }).catch((e) => console.warn("Audit error:", e));
      res.json({
        success: true,
        message: `Email de test envoy\xE9 avec succ\xE8s via ${result.provider.toUpperCase()} \xE0 ${result.recipients.join(", ")}`,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "\xC9chec de l\u2019envoi de l\u2019email de test",
        data: result
      });
    }
  } catch (err) {
    next(err);
  }
}
function getHealthCheck(_req, res) {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const isConnected = pgManager.isPgConnected();
  const dbMode = pgManager.getMode();
  if (isProduction && !isConnected) {
    res.status(503).json({
      status: "error",
      app: "BARKA SOLUTIONS API",
      code: "DATABASE_UNAVAILABLE",
      error: "Base de donn\xE9es PostgreSQL requise en production mais actuellement indisponible.",
      database: {
        mode: dbMode,
        connected: false
      },
      serverTime: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  res.json({
    status: "ok",
    app: "BARKA SOLUTIONS API",
    version: "1.0.0",
    database: {
      mode: dbMode,
      connected: isConnected
    },
    serverTime: (/* @__PURE__ */ new Date()).toISOString()
  });
}

// server/routes/company.ts
var companyRouter = Router2();
companyRouter.get("/", getCompanySettings);
companyRouter.put("/", authenticateJWT, requireRole(["ADMIN"]), updateCompanySettings);
companyRouter.get("/mailer-status", authenticateJWT, getMailerStatus);
companyRouter.post("/test-email", authenticateJWT, requireRole(["ADMIN"]), triggerTestEmail);
var healthRouter = Router2();
healthRouter.get("/", getHealthCheck);

// server/routes/stats.ts
import { Router as Router3 } from "express";

// server/controllers/statsController.ts
function getStats(_req, res, next) {
  try {
    const stats = db.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

// server/routes/stats.ts
var statsRouter = Router3();
statsRouter.get("/", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), getStats);

// server/routes/quotes.ts
import { Router as Router4 } from "express";

// server/controllers/quotesController.ts
import path4 from "path";
import fs4 from "fs";

// server/services/pricingEngine.ts
var PRICING_CONSTANTS = {
  LEGAL_NOTICE: "ESTIMATION INDICATIVE",
  CONFIRMATION_NOTICE: "Le prix d\xE9finitif sera confirm\xE9 apr\xE8s v\xE9rification du fichier et des sp\xE9cifications techniques."
};
function calculateQuotePrice(input) {
  const rawNum = Number(input.quantite);
  const qty = Number.isFinite(rawNum) && !isNaN(rawNum) ? Math.min(1e7, Math.max(1, Math.floor(rawNum))) : 1;
  const prestation = (input.typePrestation || "").toLowerCase();
  const format = (input.format || "").toLowerCase();
  const finition = (input.finition || "").toLowerCase();
  const delai = (input.delai || "").toLowerCase();
  const livraison = (input.livraisonOption || "").toLowerCase();
  const graphisme = (input.graphismeOption || "").toLowerCase();
  const impressionType = input.impressionType || "Recto seul";
  let baseUnitPrice = 250;
  let priceType = "STARTING_AT";
  try {
    const categories = db.getAllPriceCategories();
    let foundInDb = false;
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        for (const item of cat.items || []) {
          if (item.active !== false) {
            const itemName = (item.name || "").toLowerCase();
            if (prestation && (prestation.includes(itemName) || itemName.includes(prestation))) {
              if (typeof item.unitPrice === "number" && item.unitPrice > 0) {
                baseUnitPrice = item.unitPrice;
                priceType = "FIXED";
                foundInDb = true;
                break;
              }
            }
          }
        }
        if (foundInDb) break;
      }
    }
  } catch (err) {
    console.error("Erreur lecture tarifs DB:", err);
  }
  if (baseUnitPrice === 250) {
    if (prestation.includes("carte") || prestation.includes("visite")) {
      baseUnitPrice = 150;
      priceType = "FIXED";
    } else if (prestation.includes("flyer") || prestation.includes("tract")) {
      baseUnitPrice = 90;
      priceType = "FIXED";
    } else if (prestation.includes("depliant") || prestation.includes("plaquette")) {
      baseUnitPrice = 350;
      priceType = "STARTING_AT";
    } else if (prestation.includes("carnet") || prestation.includes("facturier") || prestation.includes("autocopiant")) {
      baseUnitPrice = 2500;
      priceType = "FIXED";
    } else if (prestation.includes("affiche")) {
      baseUnitPrice = 800;
      priceType = "STARTING_AT";
    } else if (prestation.includes("bache") || prestation.includes("banderole")) {
      baseUnitPrice = 4500;
      priceType = "STARTING_AT";
    } else if (prestation.includes("enseigne") || prestation.includes("lumineuse") || prestation.includes("3d")) {
      baseUnitPrice = 15e4;
      priceType = "CUSTOM_QUOTE";
    } else if (prestation.includes("roll-up") || prestation.includes("rollup") || prestation.includes("kakemono")) {
      baseUnitPrice = 35e3;
      priceType = "FIXED";
    } else if (prestation.includes("tampon") || prestation.includes("trodat")) {
      baseUnitPrice = 12500;
      priceType = "FIXED";
    } else if (prestation.includes("mug") || prestation.includes("tasse")) {
      baseUnitPrice = 3500;
      priceType = "FIXED";
    } else if (prestation.includes("t-shirt") || prestation.includes("polo") || prestation.includes("textile")) {
      baseUnitPrice = 6e3;
      priceType = "STARTING_AT";
    } else if (prestation.includes("casquette")) {
      baseUnitPrice = 3e3;
      priceType = "FIXED";
    } else if (prestation.includes("cle-usb") || prestation.includes("gadget")) {
      baseUnitPrice = 4500;
      priceType = "STARTING_AT";
    } else if (prestation.includes("badge") || prestation.includes("pvc")) {
      baseUnitPrice = 1500;
      priceType = "FIXED";
    } else if (prestation.includes("calendrier")) {
      baseUnitPrice = 1800;
      priceType = "STARTING_AT";
    } else if (prestation.includes("habillage") || prestation.includes("vehicule")) {
      baseUnitPrice = 9e4;
      priceType = "CUSTOM_QUOTE";
    } else if (prestation.includes("logo") || prestation.includes("graphique")) {
      baseUnitPrice = 45e3;
      priceType = "FIXED";
    }
  }
  let volumeDiscount = 0;
  if (qty >= 5e3) volumeDiscount = 0.35;
  else if (qty >= 2e3) volumeDiscount = 0.25;
  else if (qty >= 1e3) volumeDiscount = 0.2;
  else if (qty >= 500) volumeDiscount = 0.15;
  else if (qty >= 250) volumeDiscount = 0.1;
  else if (qty >= 100) volumeDiscount = 0.05;
  let formatMultiplier = 1;
  if (format.includes("a3")) formatMultiplier = 1.8;
  else if (format.includes("a2")) formatMultiplier = 3.2;
  else if (format.includes("a1")) formatMultiplier = 5;
  else if (format.includes("a0")) formatMultiplier = 8;
  else if (format.includes("sur-mesure") || format.includes("grand")) formatMultiplier = 1.5;
  let paperMultiplier = 1;
  const paper = (input.supportPapier || "").toLowerCase();
  const grammage = (input.grammage || "").toLowerCase();
  if (paper.includes("350g") || grammage.includes("350")) paperMultiplier = 1.3;
  else if (paper.includes("300g") || grammage.includes("300")) paperMultiplier = 1.2;
  else if (paper.includes("tripli")) paperMultiplier = 1.4;
  else if (paper.includes("quadrupli")) paperMultiplier = 1.8;
  else if (paper.includes("satin") || paper.includes("brillant")) paperMultiplier = 1.1;
  let impressionMultiplier = 1;
  if (impressionType === "Recto/Verso") {
    impressionMultiplier = 1.5;
  }
  let finishingExtra = 0;
  if (finition.includes("dorure") || finition.includes("or")) {
    finishingExtra += qty * 40;
  }
  if (finition.includes("pelliculage") || finition.includes("vernis")) {
    finishingExtra += qty * 25;
  }
  if (finition.includes("perforation") || finition.includes("numerote")) {
    finishingExtra += qty * 15;
  }
  if (finition.includes("oeillet") || finition.includes("ourlet")) {
    finishingExtra += 2500;
  }
  let urgencyExtra = 0;
  if (delai.includes("express") || delai.includes("24-48h") || delai.includes("urgence")) {
    urgencyExtra = 0.2;
  } else if (delai.includes("super") || delai.includes("12h") || delai.includes("jour m\xEAme")) {
    urgencyExtra = 0.4;
  }
  let deliveryFee = 0;
  if (livraison.includes("ngaound\xE9r\xE9") && !livraison.includes("retrait")) {
    deliveryFee = 2e3;
  } else if (livraison.includes("exp\xE9dition") || livraison.includes("inter-villes")) {
    deliveryFee = 5e3;
  }
  let graphicDesignFee = 0;
  if (graphisme.includes("cr\xE9ation") || graphisme.includes("barka") || graphisme.includes("10 000")) {
    graphicDesignFee = 1e4;
  }
  const effectiveUnitPrice = baseUnitPrice * formatMultiplier * paperMultiplier * impressionMultiplier * (1 - volumeDiscount);
  const productionSubtotal = effectiveUnitPrice * qty + finishingExtra;
  const urgencyFee = productionSubtotal * urgencyExtra;
  const totalRaw = productionSubtotal + urgencyFee + deliveryFee + graphicDesignFee;
  const finalEstimatedTotal = Math.max(1e3, Math.ceil(totalRaw / 500) * 500);
  return {
    estimatedTotal: finalEstimatedTotal,
    unitPrice: Math.round(finalEstimatedTotal / qty),
    priceType,
    details: {
      basePrice: baseUnitPrice,
      volumeDiscountPercent: volumeDiscount * 100,
      formatMultiplier,
      paperMultiplier,
      impressionMultiplier,
      finishingExtra,
      urgencyExtra: urgencyFee,
      deliveryFee,
      graphicDesignFee
    },
    legalNotice: PRICING_CONSTANTS.LEGAL_NOTICE,
    confirmationNotice: PRICING_CONSTANTS.CONFIRMATION_NOTICE
  };
}

// server/controllers/quotesController.ts
function calculatePrice(req, res, next) {
  try {
    const result = calculateQuotePrice(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}
async function createQuote(req, res, next) {
  try {
    const {
      nom,
      prenom,
      nomComplet,
      entreprise,
      email,
      telephone,
      ville,
      service,
      typePrestation,
      produit,
      quantite,
      format,
      supportPapier,
      grammage,
      impressionType,
      finition,
      delai,
      livraisonOption,
      graphismeOption,
      description
    } = req.body;
    const finalNom = nom ? String(nom).trim() : "";
    const finalPrenom = prenom ? String(prenom).trim() : "";
    const computedNomComplet = nomComplet ? String(nomComplet).trim() : `${finalPrenom} ${finalNom}`.trim() || finalNom;
    const qty = Math.max(1, Math.floor(Number(quantite) || 1));
    const finalPrestation = String(typePrestation || service || "").trim();
    const pricingResult = calculateQuotePrice({
      typePrestation: finalPrestation,
      produit: produit ? String(produit).trim() : void 0,
      quantite: qty,
      format: format ? String(format).trim() : void 0,
      supportPapier: supportPapier ? String(supportPapier).trim() : void 0,
      grammage: grammage ? String(grammage).trim() : void 0,
      impressionType: impressionType === "Recto/Verso" ? "Recto/Verso" : "Recto seul",
      finition: finition ? String(finition).trim() : void 0,
      delai: delai ? String(delai).trim() : void 0,
      livraisonOption: livraisonOption ? String(livraisonOption).trim() : void 0,
      graphismeOption: graphismeOption ? String(graphismeOption).trim() : void 0
    });
    const officialServerEstimatedPrice = pricingResult.estimatedTotal;
    const officialPriceType = pricingResult.priceType;
    const attachedFiles = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachedFiles.push({
          id: file.filename,
          originalName: file.originalname,
          storedName: file.filename,
          filePath: "",
          // Populated with secure route below once quote ID is generated
          fileSize: file.size,
          mimeType: file.mimetype,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    const newQuote = await db.createQuote({
      nom: finalNom || computedNomComplet,
      prenom: finalPrenom,
      nomComplet: computedNomComplet,
      entreprise: entreprise ? String(entreprise).trim() : "Particulier",
      telephone: String(telephone).trim(),
      email: email ? String(email).trim().toLowerCase() : "",
      ville: ville ? String(ville).trim() : "Ngaound\xE9r\xE9",
      typePrestation: finalPrestation,
      produit: produit ? String(produit).trim() : void 0,
      quantite: qty,
      format: format ? String(format).trim() : "Standard",
      supportPapier: supportPapier ? String(supportPapier).trim() : "Papier standard",
      grammage: grammage ? String(grammage).trim() : void 0,
      impressionType: impressionType === "Recto/Verso" ? "Recto/Verso" : "Recto seul",
      finition: finition ? String(finition).trim() : "Standard",
      delai: delai ? String(delai).trim() : "Standard (3-5 jours)",
      livraisonOption: livraisonOption ? String(livraisonOption).trim() : "Retrait en agence",
      graphismeOption: graphismeOption ? String(graphismeOption).trim() : "Fichier pr\xEAt fourni",
      description: description ? String(description).trim() : "",
      estimatedPrice: officialServerEstimatedPrice,
      priceType: officialPriceType,
      status: "NOUVEAU",
      files: attachedFiles.map((f) => ({
        ...f,
        filePath: `/api/quotes/${"TEMP"}/files/${f.storedName}`
      }))
    });
    if (newQuote.files && Array.isArray(newQuote.files)) {
      newQuote.files = newQuote.files.map((f) => ({
        ...f,
        filePath: `/api/quotes/${newQuote.id}/files/${f.storedName}`
      }));
    }
    const company = db.getCompanySettings();
    const waLines = [
      "BARKA SOLUTIONS S.A.S",
      "Nouvelle demande de devis",
      "",
      `R\xE9f : ${newQuote.id}`,
      `Nom : ${newQuote.nomComplet}`,
      `Entreprise : ${newQuote.entreprise || "Particulier"}`,
      `T\xE9l\xE9phone : ${newQuote.telephone}`,
      `Email : ${newQuote.email || "Non renseign\xE9"}`,
      `Ville : ${newQuote.ville}`,
      `Service : ${newQuote.typePrestation}`,
      `Produit : ${newQuote.produit || "Standard"}`,
      `Quantit\xE9 : ${newQuote.quantite} ex`,
      `Format : ${newQuote.format}`,
      `Finition : ${newQuote.finition}`,
      `D\xE9lai : ${newQuote.delai}`,
      `Estimation : ~${(newQuote.estimatedPrice || 0).toLocaleString("fr-FR")} FCFA (Indicative)`,
      `Description : ${newQuote.description || "Aucune"}`
    ];
    const waText = encodeURIComponent(waLines.join("\n"));
    const whatsappUrl = `https://wa.me/${company.whatsapp_raw || "237696311198"}?text=${waText}`;
    let emailStatus = {
      sentToAdmin: false,
      sentToClient: false,
      adminRecipients: ["direction@barkasolutions.org", "kouchoumichel@yahoo.fr"],
      clientRecipient: newQuote.email || void 0,
      error: void 0
    };
    try {
      const mailResult = await sendQuoteNotifications(newQuote);
      emailStatus = {
        sentToAdmin: mailResult.sentToAdmin,
        sentToClient: mailResult.sentToClient,
        adminRecipients: mailResult.adminRecipients,
        clientRecipient: mailResult.clientRecipient,
        error: mailResult.error
      };
    } catch (mailErr) {
      const errMessage = mailErr instanceof Error ? mailErr.message : "Erreur transmission email";
      console.error("[MAILER] \u274C Erreur lors de l\u2019envoi de notification devis:", errMessage);
      emailStatus.error = errMessage;
    }
    res.status(201).json({
      success: true,
      message: "Votre demande de devis a \xE9t\xE9 enregistr\xE9e avec succ\xE8s.",
      data: newQuote,
      whatsappUrl,
      sentToAdmin: emailStatus.sentToAdmin,
      sentToClient: emailStatus.sentToClient,
      emailStatus,
      legalNotice: pricingResult.legalNotice,
      confirmationNotice: pricingResult.confirmationNotice
    });
  } catch (err) {
    next(err);
  }
}
function listQuotes(req, res, next) {
  try {
    const { status } = req.query;
    const quotes = db.getAllQuotes(status ? normalizeQuoteStatus(String(status)) : void 0);
    res.json({
      success: true,
      count: quotes.length,
      data: quotes
    });
  } catch (err) {
    next(err);
  }
}
function getQuote(req, res, next) {
  try {
    const quote = db.getQuoteById(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, error: "Devis introuvable" });
      return;
    }
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}
function updateQuote(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminNotes, finalPrice, estimatedPrice, description } = req.body;
    const quote = db.getQuoteById(id);
    if (!quote) {
      res.status(404).json({ success: false, error: "Devis introuvable" });
      return;
    }
    const oldSnapshot = {
      status: quote.status,
      adminNotes: quote.adminNotes,
      finalPrice: quote.finalPrice,
      estimatedPrice: quote.estimatedPrice,
      description: quote.description
    };
    const updates = {};
    if (status) {
      const targetStatus = normalizeQuoteStatus(status);
      if (quote.status !== targetStatus && !isValidQuoteStatusTransition(quote.status, targetStatus)) {
        if (req.user?.role !== "ADMIN") {
          res.status(409).json({
            success: false,
            error: `Transition de statut invalide : le passage de '${quote.status}' \xE0 '${targetStatus}' n'est pas autoris\xE9.`,
            code: "INVALID_STATUS_TRANSITION"
          });
          return;
        }
      }
      updates.status = targetStatus;
    }
    if (adminNotes !== void 0) updates.adminNotes = adminNotes;
    if (finalPrice !== void 0) updates.finalPrice = Number(finalPrice);
    if (estimatedPrice !== void 0) updates.estimatedPrice = Number(estimatedPrice);
    if (description !== void 0) updates.description = description;
    const updatedQuote = db.updateQuote(id, updates, req.user?.fullName || req.user?.username);
    const statusChanged = status && status !== oldSnapshot.status;
    logAdminAction({
      req,
      action: statusChanged ? "STATUS_CHANGE" : "UPDATE",
      resource: "DEVIS",
      resourceId: id,
      resourceTitle: quote.nomComplet ? `Devis ${quote.nomComplet}` : `Devis #${id}`,
      description: statusChanged ? `${req.user?.role || "EDITOR"} a chang\xE9 le statut du devis (#${id} : ${oldSnapshot.status} -> ${status}).` : `${req.user?.role || "EDITOR"} a modifi\xE9 le devis #${id}.`,
      oldValue: oldSnapshot,
      newValue: {
        status: updatedQuote?.status,
        adminNotes: updatedQuote?.adminNotes,
        finalPrice: updatedQuote?.finalPrice,
        estimatedPrice: updatedQuote?.estimatedPrice,
        description: updatedQuote?.description
      }
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: "Devis mis \xE0 jour avec succ\xE8s",
      data: updatedQuote
    });
  } catch (err) {
    next(err);
  }
}
function deleteQuote(req, res, next) {
  try {
    const { id } = req.params;
    const quote = db.getQuoteById(id);
    if (!quote) {
      res.status(404).json({ success: false, error: "Devis introuvable" });
      return;
    }
    if (quote.files && Array.isArray(quote.files)) {
      deleteQuotePhysicalFiles(quote.files);
    }
    const success = db.deleteQuote(id);
    if (!success) {
      res.status(404).json({ success: false, error: "Erreur lors de la suppression du devis" });
      return;
    }
    logAdminAction({
      req,
      action: "DELETE",
      resource: "DEVIS",
      resourceId: id,
      resourceTitle: `Devis ${quote.nomComplet || id}`,
      description: `${req.user?.role || "ADMIN"} a supprim\xE9 le devis #${id} (${quote.nomComplet || "Client"}).`,
      oldValue: {
        id: quote.id,
        nomComplet: quote.nomComplet,
        entreprise: quote.entreprise,
        status: quote.status,
        estimatedPrice: quote.estimatedPrice
      },
      newValue: null
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: `Devis ${id} supprim\xE9 avec succ\xE8s`
    });
  } catch (err) {
    next(err);
  }
}
function downloadQuoteFile(req, res, next) {
  try {
    const { quoteId, fileId } = req.params;
    if (!quoteId || !fileId) {
      res.status(400).json({ success: false, error: "Param\xE8tres quoteId et fileId obligatoires." });
      return;
    }
    if (fileId.includes("..") || fileId.includes("/") || fileId.includes("\\") || fileId.includes("\0") || quoteId.includes("..") || quoteId.includes("/") || quoteId.includes("\\")) {
      res.status(400).json({ success: false, error: "Requ\xEAte ou identifiant de fichier invalide." });
      return;
    }
    const quote = db.getQuoteById(quoteId);
    if (!quote) {
      res.status(404).json({ success: false, error: "Devis introuvable." });
      return;
    }
    const fileMeta = quote.files?.find(
      (f) => f.id === fileId || f.storedName === fileId || path4.basename(f.filePath || "") === fileId
    );
    if (!fileMeta) {
      res.status(404).json({ success: false, error: "Fichier non trouv\xE9 pour ce devis." });
      return;
    }
    const safeStoredName = path4.basename(fileMeta.storedName || fileId);
    const absolutePath = path4.resolve(QUOTES_UPLOADS_DIR, safeStoredName);
    if (!absolutePath.startsWith(QUOTES_UPLOADS_DIR)) {
      res.status(403).json({ success: false, error: "Acc\xE8s non autoris\xE9." });
      return;
    }
    if (!fs4.existsSync(absolutePath)) {
      res.status(404).json({ success: false, error: "Le fichier physique est introuvable sur le serveur." });
      return;
    }
    const sanitizedOriginalName = (fileMeta.originalName || "document").replace(/[\r\n\0"]/g, "_").trim();
    res.setHeader("Content-Type", fileMeta.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(sanitizedOriginalName)}"; filename*=UTF-8''${encodeURIComponent(sanitizedOriginalName)}`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
}

// server/middleware/uploadMiddleware.ts
import multer2 from "multer";
import path6 from "path";
import fs6 from "fs";

// server/services/fileValidator.ts
import fs5 from "fs";
import path5 from "path";
function readHeaderBytes(filePath, length = 512) {
  const fd = fs5.openSync(filePath, "r");
  const buffer = Buffer.alloc(length);
  try {
    fs5.readSync(fd, buffer, 0, length, 0);
  } finally {
    fs5.closeSync(fd);
  }
  return buffer;
}
function validateSvgContent(filePath) {
  try {
    const stats = fs5.statSync(filePath);
    if (stats.size > 5 * 1024 * 1024) {
      return { valid: false, error: "Fichier SVG trop volumineux (max 5 Mo)." };
    }
    const content = fs5.readFileSync(filePath, "utf-8");
    const lower = content.toLowerCase();
    if (!lower.includes("<svg")) {
      return { valid: false, error: "Fichier SVG invalide : balise <svg> manquante." };
    }
    if (lower.includes("<!doctype") && (lower.includes("<!entity") || lower.includes("system") || lower.includes("public"))) {
      return { valid: false, error: "Fichier SVG rejet\xE9 : d\xE9clarations d\u2019entit\xE9s externes (XXE) interdites." };
    }
    const forbiddenPatterns = [
      /<script[\s>]/i,
      /<\/script>/i,
      /<foreignobject[\s>]/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      // onload=, onerror=, onclick=, etc.
      /<iframe[\s>]/i,
      /<embed[\s>]/i,
      /<object[\s>]/i,
      /xlink:href=["']javascript:/i,
      /href=["']javascript:/i
    ];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          error: "Fichier SVG rejet\xE9 : contient du code ex\xE9cutable ou des scripts non s\xE9curis\xE9s."
        };
      }
    }
    return { valid: true, detectedType: "image/svg+xml" };
  } catch (err) {
    return { valid: false, error: `Erreur lors de l\u2019analyse du fichier SVG: ${err.message}` };
  }
}
function validateUploadedFile(filePath, originalName, category = "quote") {
  if (!fs5.existsSync(filePath)) {
    return { valid: false, error: "Fichier introuvable sur le disque." };
  }
  const ext = path5.extname(originalName).toLowerCase();
  const header = readHeaderBytes(filePath, 64);
  if (category === "portfolio") {
    if (ext === ".png") {
      const isPng = header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71 && header[4] === 13 && header[5] === 10 && header[6] === 26 && header[7] === 10;
      if (!isPng) {
        return { valid: false, error: "Signature binaire PNG invalide." };
      }
      return { valid: true, detectedType: "image/png" };
    }
    if (ext === ".jpg" || ext === ".jpeg") {
      const isJpg = header[0] === 255 && header[1] === 216 && header[2] === 255;
      if (!isJpg) {
        return { valid: false, error: "Signature binaire JPEG invalide." };
      }
      return { valid: true, detectedType: "image/jpeg" };
    }
    if (ext === ".webp") {
      const isRiff = header.toString("ascii", 0, 4) === "RIFF";
      const isWebp = header.toString("ascii", 8, 12) === "WEBP";
      if (!isRiff || !isWebp) {
        return { valid: false, error: "Signature binaire WEBP invalide." };
      }
      return { valid: true, detectedType: "image/webp" };
    }
    return {
      valid: false,
      error: `Format de portfolio non autoris\xE9 (${ext}). Seuls PNG, JPG et WEBP sont accept\xE9s.`
    };
  }
  if (ext === ".png") {
    const isPng = header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71 && header[4] === 13 && header[5] === 10 && header[6] === 26 && header[7] === 10;
    if (!isPng) return { valid: false, error: "Signature binaire PNG invalide." };
    return { valid: true, detectedType: "image/png" };
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    const isJpg = header[0] === 255 && header[1] === 216 && header[2] === 255;
    if (!isJpg) return { valid: false, error: "Signature binaire JPEG invalide." };
    return { valid: true, detectedType: "image/jpeg" };
  }
  if (ext === ".pdf") {
    const isPdf = header.toString("ascii", 0, 5) === "%PDF-";
    if (!isPdf) return { valid: false, error: "Signature binaire PDF invalide (%PDF- manquant)." };
    return { valid: true, detectedType: "application/pdf" };
  }
  if (ext === ".svg") {
    return validateSvgContent(filePath);
  }
  if (ext === ".psd") {
    const isPsd = header.toString("ascii", 0, 4) === "8BPS";
    if (!isPsd) return { valid: false, error: "Signature binaire Photoshop PSD invalide (8BPS manquant)." };
    return { valid: true, detectedType: "image/vnd.adobe.photoshop" };
  }
  if (ext === ".eps") {
    const isPostscript = header.toString("ascii", 0, 4) === "%!PS";
    const isDosEps = header[0] === 197 && header[1] === 208 && header[2] === 211 && header[3] === 198;
    if (!isPostscript && !isDosEps) {
      return { valid: false, error: "Signature binaire EPS invalide." };
    }
    return { valid: true, detectedType: "application/postscript" };
  }
  if (ext === ".zip") {
    const isZip = header[0] === 80 && header[1] === 75 && (header[2] === 3 || header[2] === 5 || header[2] === 7);
    if (!isZip) return { valid: false, error: "Signature binaire ZIP invalide." };
    return { valid: true, detectedType: "application/zip" };
  }
  if (ext === ".ai") {
    const isPdf = header.toString("ascii", 0, 5) === "%PDF-";
    const isPs = header.toString("ascii", 0, 4) === "%!PS";
    if (!isPdf && !isPs) {
      return { valid: false, error: "Signature de fichier Adobe Illustrator (.ai) invalide." };
    }
    return { valid: true, detectedType: "application/illustrator" };
  }
  if (ext === ".cdr") {
    const isZip = header[0] === 80 && header[1] === 75;
    const isRiff = header.toString("ascii", 0, 4) === "RIFF";
    if (!isZip && !isRiff) {
      return { valid: false, error: "Signature de fichier CorelDRAW (.cdr) invalide." };
    }
    return { valid: true, detectedType: "application/cdr" };
  }
  if (ext === ".indd") {
    const isIndd = header[0] === 6 && header[1] === 6 && header[2] === 237 && header[3] === 245 || header[0] === 80 && header[1] === 75;
    if (!isIndd) {
      return { valid: false, error: "Signature de fichier Adobe InDesign (.indd) invalide." };
    }
    return { valid: true, detectedType: "application/x-indesign" };
  }
  return { valid: false, error: `Type de fichier non autoris\xE9 : ${ext}` };
}

// server/middleware/uploadMiddleware.ts
var QUOTE_ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".ai",
  ".psd",
  ".eps",
  ".cdr",
  ".indd",
  ".zip"
]);
var QUOTE_ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set([
  "application/pdf",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/svg+xml",
  "application/postscript",
  "image/vnd.adobe.photoshop",
  "image/x-photoshop",
  "application/x-photoshop",
  "application/photoshop",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "application/x-cdr",
  "application/cdr",
  "image/x-cdr",
  "application/x-indesign",
  "application/indesign",
  "application/illustrator",
  "application/octet-stream"
  // Utilisé pour les formats vectoriels/PAO propriétaires
]);
var quoteStorage = multer2.diskStorage({
  destination: (req, file, cb) => {
    if (!fs6.existsSync(QUOTES_UPLOADS_DIR)) {
      fs6.mkdirSync(QUOTES_UPLOADS_DIR, { recursive: true });
    }
    cb(null, QUOTES_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const cleanOriginalName = path6.basename(file.originalname).replace(/[\r\n\0]/g, "");
    const safeName = generateRandomFileName(cleanOriginalName, "quote");
    cb(null, safeName);
  }
});
var quoteFileFilter = (req, file, cb) => {
  const ext = path6.extname(file.originalname).toLowerCase();
  if (!QUOTE_ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new Error(
        `Format de fichier non autoris\xE9 (${ext}). Formats accept\xE9s pour les devis : PDF, JPG, JPEG, PNG, SVG, AI, PSD, EPS, CDR, INDD, ZIP.`
      )
    );
  }
  if (file.mimetype && !QUOTE_ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`Type MIME non autoris\xE9 (${file.mimetype}) pour la pi\xE8ce jointe.`));
  }
  cb(null, true);
};
var quoteUpload = multer2({
  storage: quoteStorage,
  fileFilter: quoteFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    // Limite stricte : 50 Mo par fichier
    files: 5
    // Maximum 5 fichiers par devis
  }
});
var PORTFOLIO_ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".webp"]);
var PORTFOLIO_ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp"
]);
var portfolioStorage = multer2.diskStorage({
  destination: (req, file, cb) => {
    if (!fs6.existsSync(PORTFOLIO_UPLOADS_DIR)) {
      fs6.mkdirSync(PORTFOLIO_UPLOADS_DIR, { recursive: true });
    }
    cb(null, PORTFOLIO_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const cleanOriginalName = path6.basename(file.originalname).replace(/[\r\n\0]/g, "");
    const safeName = generateRandomFileName(cleanOriginalName, "portfolio");
    cb(null, safeName);
  }
});
var portfolioFileFilter = (req, file, cb) => {
  const ext = path6.extname(file.originalname).toLowerCase();
  if (!PORTFOLIO_ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new Error(
        `Format d'image non autoris\xE9 (${ext}). Seuls les formats d'image JPG, JPEG, PNG et WEBP sont accept\xE9s pour le portfolio.`
      )
    );
  }
  if (!file.mimetype || !PORTFOLIO_ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error(
        `Type MIME invalide (${file.mimetype || "inconnu"}). Seules les images r\xE9elles (JPG, PNG, WEBP) sont autoris\xE9es.`
      )
    );
  }
  cb(null, true);
};
var portfolioUpload = multer2({
  storage: portfolioStorage,
  fileFilter: portfolioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    // Limite : 10 Mo par image portfolio
    files: 1
    // Une seule image à la fois
  }
});
function validateQuoteFilesMiddleware(req, res, next) {
  const files = req.files;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return next();
  }
  for (const file of files) {
    const check = validateUploadedFile(file.path, file.originalname, "quote");
    if (!check.valid) {
      deleteMulterFiles(files);
      res.status(400).json({
        success: false,
        error: `Fichier rejet\xE9 (${file.originalname}) : ${check.error || "Signature binaire invalide ou non conforme."}`,
        code: "INVALID_FILE_SIGNATURE"
      });
      return;
    }
    if (check.detectedType) {
      file.mimetype = check.detectedType;
    }
  }
  next();
}
function validatePortfolioFileMiddleware(req, res, next) {
  const file = req.file;
  if (!file) {
    return next();
  }
  const check = validateUploadedFile(file.path, file.originalname, "portfolio");
  if (!check.valid) {
    deleteMulterFiles([file]);
    res.status(400).json({
      success: false,
      error: `Image rejet\xE9e (${file.originalname}) : ${check.error || "Signature binaire d\u2019image non conforme."}`,
      code: "INVALID_IMAGE_SIGNATURE"
    });
    return;
  }
  if (check.detectedType) {
    file.mimetype = check.detectedType;
  }
  next();
}

// server/routes/quotes.ts
var quotesRouter = Router4();
quotesRouter.post("/calculate-price", validatePricingInput, calculatePrice);
quotesRouter.post(
  "/",
  quotesRateLimiter,
  quoteUpload.array("files", 5),
  validateQuoteFilesMiddleware,
  uploadAbuseLimiter,
  honeypotBotGuard,
  validateQuoteInput,
  createQuote
);
quotesRouter.get("/", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), listQuotes);
quotesRouter.get("/:quoteId/files/:fileId", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), downloadQuoteFile);
quotesRouter.get("/:id", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), getQuote);
quotesRouter.patch("/:id", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), updateQuote);
quotesRouter.delete("/:id", authenticateJWT, requireRole(["ADMIN"]), deleteQuote);

// server/routes/contact.ts
import { Router as Router5 } from "express";

// server/controllers/contactController.ts
async function sendMessage(req, res, next) {
  try {
    const { name, emailOrPhone, subject, message } = req.body;
    const newMsg = db.createMessage({
      name: String(name).trim(),
      emailOrPhone: String(emailOrPhone).trim(),
      subject: subject ? String(subject).trim() : "Demande d\u2019information BARKA SOLUTIONS",
      message: String(message).trim()
    });
    const company = db.getCompanySettings();
    const waText = encodeURIComponent(
      `Bonjour BARKA SOLUTIONS,

Message de : ${newMsg.name}
Contact : ${newMsg.emailOrPhone}
Objet : ${newMsg.subject}

${newMsg.message}`
    );
    const whatsappUrl = `https://wa.me/${company.whatsapp_raw}?text=${waText}`;
    let sentToAdmin = false;
    let emailError;
    try {
      const mailResult = await sendContactNotification(newMsg);
      sentToAdmin = mailResult.sentToAdmin;
      emailError = mailResult.error;
    } catch (mailErr) {
      const msg = mailErr instanceof Error ? mailErr.message : "Erreur notification email contact";
      console.error("[MAILER] \u274C Erreur contact notification:", msg);
      emailError = msg;
    }
    res.status(201).json({
      success: true,
      message: "Votre message a \xE9t\xE9 transmis avec succ\xE8s \xE0 l\u2019\xE9quipe BARKA SOLUTIONS.",
      data: newMsg,
      whatsappUrl,
      sentToAdmin,
      emailError: emailError || null
    });
  } catch (err) {
    next(err);
  }
}
function listMessages(_req, res, next) {
  try {
    const messages = db.getAllMessages();
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    next(err);
  }
}
function updateMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { read, adminReply } = req.body;
    const existingMsg = db.getAllMessages().find((m) => m.id === id);
    const updated = db.updateMessage(id, { read: Boolean(read), adminReply });
    if (!updated) {
      res.status(404).json({ success: false, error: "Message introuvable" });
      return;
    }
    if (adminReply && adminReply !== existingMsg?.adminReply) {
      logAdminAction({
        req,
        action: "UPDATE",
        resource: "MESSAGE",
        resourceId: id,
        resourceTitle: updated.subject || `Message de ${updated.name}`,
        description: `${req.user?.role || "EDITOR"} a r\xE9pondu au message (#${id} - ${updated.name}).`,
        oldValue: { adminReply: existingMsg?.adminReply },
        newValue: { adminReply: updated.adminReply }
      }).catch((e) => console.warn("Audit error:", e));
    }
    res.json({
      success: true,
      message: "Message mis \xE0 jour",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}
function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const existingMsg = db.getAllMessages().find((m) => m.id === id);
    const success = db.deleteMessage(id);
    if (!success) {
      res.status(404).json({ success: false, error: "Message introuvable" });
      return;
    }
    logAdminAction({
      req,
      action: "DELETE",
      resource: "MESSAGE",
      resourceId: id,
      resourceTitle: existingMsg?.subject || `Message #${id}`,
      description: `${req.user?.role || "ADMIN"} a supprim\xE9 un message (#${id} de ${existingMsg?.name || "Inconnu"}).`,
      oldValue: existingMsg,
      newValue: null
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: `Message ${id} supprim\xE9`
    });
  } catch (err) {
    next(err);
  }
}

// server/routes/contact.ts
var contactRouter = Router5();
contactRouter.post(
  "/",
  contactRateLimiter,
  honeypotBotGuard,
  validateContactInput,
  sendMessage
);
contactRouter.get("/", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), listMessages);
contactRouter.patch("/:id", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), updateMessage);
contactRouter.delete("/:id", authenticateJWT, requireRole(["ADMIN"]), deleteMessage);

// server/routes/portfolio.ts
import { Router as Router6 } from "express";

// server/controllers/portfolioController.ts
function listPortfolio(req, res, next) {
  try {
    const { category, includeInactive } = req.query;
    const portfolio = db.getAllPortfolio(
      category ? String(category) : void 0,
      includeInactive === "true"
    );
    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio
    });
  } catch (err) {
    next(err);
  }
}
function getPortfolioItem(req, res, next) {
  try {
    const item = db.getPortfolioById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: "R\xE9alisation introuvable" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}
function createPortfolioItem(req, res, next) {
  try {
    const { title, category, description, client, year, tags, featured, active, isDemo, serviceAssocie, serviceId } = req.body;
    if (!title || !category || !description) {
      res.status(400).json({ success: false, error: "Titre, cat\xE9gorie et description requis" });
      return;
    }
    let imageUrl = "";
    const imagesList = [];
    if (req.file) {
      imageUrl = `/uploads/portfolio/${req.file.filename}`;
      imagesList.push(imageUrl);
    } else if (req.body.image || req.body.imageUrl) {
      imageUrl = String(req.body.image || req.body.imageUrl);
      imagesList.push(imageUrl);
    }
    const newItem = db.createPortfolioItem({
      title: String(title).trim(),
      category,
      description: String(description).trim(),
      image: imageUrl,
      images: imagesList,
      client: client ? String(client).trim() : void 0,
      year: year ? String(year).trim() : (/* @__PURE__ */ new Date()).getFullYear().toString(),
      tags: tags ? Array.isArray(tags) ? tags : String(tags).split(",").map((t) => t.trim()).filter(Boolean) : [],
      featured: Boolean(featured),
      active: active !== void 0 ? Boolean(active) : true,
      isDemo: Boolean(isDemo),
      serviceAssocie: serviceAssocie ? String(serviceAssocie).trim() : void 0,
      serviceId: serviceId ? String(serviceId).trim() : void 0
    });
    logAdminAction({
      req,
      action: "CREATE",
      resource: "PORTFOLIO",
      resourceId: newItem.id,
      resourceTitle: newItem.title,
      description: `${req.user?.role || "ADMIN"} a cr\xE9\xE9 une r\xE9alisation portfolio (${newItem.title}).`,
      oldValue: null,
      newValue: newItem
    }).catch((e) => console.warn("Audit error:", e));
    res.status(201).json({
      success: true,
      message: "R\xE9alisation ajout\xE9e avec succ\xE8s au portfolio",
      data: newItem
    });
  } catch (err) {
    next(err);
  }
}
function updatePortfolioItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getPortfolioById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "R\xE9alisation introuvable" });
      return;
    }
    const oldSnapshot = { ...existing };
    const allowedKeys = [
      "title",
      "category",
      "description",
      "client",
      "year",
      "tags",
      "featured",
      "active",
      "isDemo",
      "serviceAssocie",
      "serviceId",
      "image",
      "images"
    ];
    const updates = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== void 0) {
        updates[key] = req.body[key];
      }
    }
    if (req.file) {
      if (existing.image && existing.image.startsWith("/uploads/portfolio/")) {
        deletePortfolioPhysicalImage(existing.image);
      }
      updates.image = `/uploads/portfolio/${req.file.filename}`;
      updates.images = [updates.image];
    } else if (req.body.image || req.body.imageUrl) {
      updates.image = String(req.body.image || req.body.imageUrl);
      if (!updates.images || updates.images.length === 0) {
        updates.images = [updates.image];
      }
    }
    if (updates.tags && typeof updates.tags === "string") {
      updates.tags = updates.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (updates.active !== void 0) {
      updates.active = Boolean(updates.active);
    }
    if (updates.isDemo !== void 0) {
      updates.isDemo = Boolean(updates.isDemo);
    }
    if (updates.featured !== void 0) {
      updates.featured = Boolean(updates.featured);
    }
    const updated = db.updatePortfolioItem(id, updates);
    logAdminAction({
      req,
      action: "UPDATE",
      resource: "PORTFOLIO",
      resourceId: id,
      resourceTitle: updated?.title || existing.title,
      description: `${req.user?.role || "ADMIN"} a modifi\xE9 un portfolio (${updated?.title || existing.title}).`,
      oldValue: oldSnapshot,
      newValue: updated
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: "R\xE9alisation mise \xE0 jour avec succ\xE8s",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}
function togglePortfolioItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getPortfolioById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "R\xE9alisation introuvable" });
      return;
    }
    const { active } = req.body;
    const updated = db.togglePortfolioItem(id, active !== void 0 ? Boolean(active) : void 0);
    if (!updated) {
      res.status(404).json({ success: false, error: "R\xE9alisation introuvable" });
      return;
    }
    logAdminAction({
      req,
      action: "TOGGLE_STATUS",
      resource: "PORTFOLIO",
      resourceId: id,
      resourceTitle: updated.title,
      description: `${req.user?.role || "ADMIN"} a ${updated.active !== false ? "activ\xE9" : "d\xE9sactiv\xE9"} la r\xE9alisation portfolio (${updated.title}).`,
      oldValue: { active: existing.active },
      newValue: { active: updated.active }
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: `Statut de la r\xE9alisation ${updated.active !== false ? "activ\xE9" : "d\xE9sactiv\xE9"}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}
function deletePortfolioItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getPortfolioById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "R\xE9alisation introuvable" });
      return;
    }
    if (existing.image && existing.image.startsWith("/uploads/portfolio/")) {
      deletePortfolioPhysicalImage(existing.image);
    }
    if (existing.images && Array.isArray(existing.images)) {
      for (const img of existing.images) {
        if (img && img.startsWith("/uploads/portfolio/")) {
          deletePortfolioPhysicalImage(img);
        }
      }
    }
    const success = db.deletePortfolioItem(id);
    if (!success) {
      res.status(404).json({ success: false, error: "Erreur lors de la suppression de la r\xE9alisation" });
      return;
    }
    logAdminAction({
      req,
      action: "DELETE",
      resource: "PORTFOLIO",
      resourceId: id,
      resourceTitle: existing.title,
      description: `${req.user?.role || "ADMIN"} a supprim\xE9 un portfolio (${existing.title}).`,
      oldValue: existing,
      newValue: null
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: `R\xE9alisation ${id} supprim\xE9e avec succ\xE8s`
    });
  } catch (err) {
    next(err);
  }
}
function uploadPortfolioImage(req, res, next) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "Aucun fichier image fourni" });
      return;
    }
    res.json({
      success: true,
      imageUrl: `/uploads/portfolio/${req.file.filename}`,
      message: "Image t\xE9l\xE9vers\xE9e avec succ\xE8s"
    });
  } catch (err) {
    next(err);
  }
}

// server/routes/portfolio.ts
var portfolioRouter = Router6();
portfolioRouter.get("/", listPortfolio);
portfolioRouter.get("/:id", getPortfolioItem);
portfolioRouter.post(
  "/upload-image",
  authenticateJWT,
  requireRole(["ADMIN", "EDITOR"]),
  portfolioUpload.single("image"),
  validatePortfolioFileMiddleware,
  uploadPortfolioImage
);
portfolioRouter.post(
  "/",
  authenticateJWT,
  requireRole(["ADMIN", "EDITOR"]),
  portfolioUpload.single("image"),
  validatePortfolioFileMiddleware,
  createPortfolioItem
);
portfolioRouter.patch("/:id/toggle", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), togglePortfolioItem);
portfolioRouter.patch(
  "/:id",
  authenticateJWT,
  requireRole(["ADMIN", "EDITOR"]),
  portfolioUpload.single("image"),
  validatePortfolioFileMiddleware,
  updatePortfolioItem
);
portfolioRouter.delete(
  "/:id",
  authenticateJWT,
  requireRole(["ADMIN"]),
  deletePortfolioItem
);

// server/routes/services.ts
import { Router as Router7 } from "express";

// server/controllers/servicesController.ts
function listServices(req, res, next) {
  try {
    const activeOnly = req.query.all !== "true";
    const services = db.getAllServices(activeOnly);
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    next(err);
  }
}
function getService(req, res, next) {
  try {
    const service = db.getServiceById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: "Service introuvable" });
      return;
    }
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}
function createService(req, res, next) {
  try {
    const {
      title,
      category,
      groupId,
      groupTitle,
      shortDesc,
      fullDesc,
      iconName,
      image,
      popular,
      active,
      priceStartingAt,
      features,
      sampleDeliverables,
      quoteTypePrestation
    } = req.body;
    if (!title || !category || !shortDesc) {
      res.status(400).json({ success: false, error: "Titre, cat\xE9gorie et courte description requis" });
      return;
    }
    const newService = db.createService({
      id: req.body.id ? String(req.body.id).trim() : void 0,
      title: String(title).trim(),
      category: String(category).trim(),
      groupId: groupId || "imprimerie",
      groupTitle: groupTitle || "Imprimerie",
      shortDesc: String(shortDesc).trim(),
      fullDesc: fullDesc ? String(fullDesc).trim() : String(shortDesc).trim(),
      iconName: iconName || "Printer",
      image: image || "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
      popular: Boolean(popular),
      active: active !== void 0 ? Boolean(active) : true,
      priceStartingAt: priceStartingAt ? Number(priceStartingAt) : void 0,
      features: Array.isArray(features) ? features : [],
      sampleDeliverables: Array.isArray(sampleDeliverables) ? sampleDeliverables : [],
      quoteTypePrestation: quoteTypePrestation || String(title).trim()
    });
    logAdminAction({
      req,
      action: "CREATE",
      resource: "SERVICE",
      resourceId: newService.id,
      resourceTitle: newService.title,
      description: `${req.user?.role || "ADMIN"} a cr\xE9\xE9 un service (${newService.title}).`,
      oldValue: null,
      newValue: newService
    }).catch((e) => console.warn("Audit error:", e));
    res.status(201).json({
      success: true,
      message: "Service cr\xE9\xE9 avec succ\xE8s",
      data: newService
    });
  } catch (err) {
    next(err);
  }
}
function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getServiceById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Service introuvable" });
      return;
    }
    const oldSnapshot = { ...existing };
    const updated = db.updateService(id, req.body);
    logAdminAction({
      req,
      action: "UPDATE",
      resource: "SERVICE",
      resourceId: id,
      resourceTitle: updated?.title || existing.title,
      description: `${req.user?.role || "ADMIN"} a modifi\xE9 un service (${updated?.title || existing.title}).`,
      oldValue: oldSnapshot,
      newValue: updated
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: "Service mis \xE0 jour avec succ\xE8s",
      data: updated
    });
  } catch (err) {
    next(err);
  }
}
function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getServiceById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Service introuvable" });
      return;
    }
    const success = db.deleteService(id);
    if (!success) {
      res.status(404).json({ success: false, error: "Service introuvable" });
      return;
    }
    logAdminAction({
      req,
      action: "DELETE",
      resource: "SERVICE",
      resourceId: id,
      resourceTitle: existing.title,
      description: `${req.user?.role || "ADMIN"} a supprim\xE9 un service (${existing.title}).`,
      oldValue: existing,
      newValue: null
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: `Service ${id} supprim\xE9 avec succ\xE8s`
    });
  } catch (err) {
    next(err);
  }
}

// server/routes/services.ts
var servicesRouter = Router7();
servicesRouter.get("/", listServices);
servicesRouter.get("/:id", getService);
servicesRouter.post("/", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), createService);
servicesRouter.patch("/:id", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), updateService);
servicesRouter.delete("/:id", authenticateJWT, requireRole(["ADMIN"]), deleteService);

// server/routes/prices.ts
import { Router as Router8 } from "express";

// server/controllers/pricesController.ts
function listPriceCategories(_req, res, next) {
  try {
    const categories = db.getAllPriceCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
}
function savePriceItem(req, res, next) {
  try {
    const { categoryId } = req.params;
    const item = { ...req.body };
    const isNew = !item.id;
    if (!item.id) {
      item.id = `price-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!item.name || item.unitPrice === void 0) {
      res.status(400).json({ success: false, error: "Nom et prix unitaire requis" });
      return;
    }
    const currentCategory = db.getPriceCategoryById(categoryId);
    const oldItem = currentCategory?.items?.find((i) => i.id === item.id) || null;
    const saved = db.savePriceCategoryItem(categoryId, item);
    logAdminAction({
      req,
      action: isNew || !oldItem ? "CREATE" : "UPDATE",
      resource: "TARIF",
      resourceId: item.id,
      resourceTitle: item.name,
      description: isNew || !oldItem ? `${req.user?.role || "ADMIN"} a cr\xE9\xE9 le tarif (${item.name} - ${item.unitPrice} FCFA).` : `${req.user?.role || "ADMIN"} a modifi\xE9 le tarif (${item.name}).`,
      oldValue: oldItem,
      newValue: saved
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: "Tarif enregistr\xE9 avec succ\xE8s",
      data: saved
    });
  } catch (err) {
    next(err);
  }
}
function deletePriceItem(req, res, next) {
  try {
    const { categoryId, itemId } = req.params;
    const currentCategory = db.getPriceCategoryById(categoryId);
    const oldItem = currentCategory?.items?.find((i) => i.id === itemId) || null;
    const success = db.deletePriceCategoryItem(categoryId, itemId);
    if (!success) {
      res.status(404).json({ success: false, error: "Ligne tarifaire introuvable" });
      return;
    }
    logAdminAction({
      req,
      action: "DELETE",
      resource: "TARIF",
      resourceId: itemId,
      resourceTitle: oldItem?.name || itemId,
      description: `${req.user?.role || "ADMIN"} a supprim\xE9 le tarif (${oldItem?.name || itemId}).`,
      oldValue: oldItem,
      newValue: null
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: "Ligne tarifaire supprim\xE9e avec succ\xE8s"
    });
  } catch (err) {
    next(err);
  }
}
function togglePriceItem(req, res, next) {
  try {
    const { categoryId, itemId } = req.params;
    const currentCategory = db.getPriceCategoryById(categoryId);
    const oldItem = currentCategory?.items?.find((i) => i.id === itemId) || null;
    const updated = db.togglePriceCategoryItem(categoryId, itemId);
    if (!updated) {
      res.status(404).json({ success: false, error: "Ligne tarifaire introuvable" });
      return;
    }
    logAdminAction({
      req,
      action: "TOGGLE_STATUS",
      resource: "TARIF",
      resourceId: itemId,
      resourceTitle: updated.name,
      description: `${req.user?.role || "ADMIN"} a ${updated.active ? "activ\xE9" : "d\xE9sactiv\xE9"} le tarif (${updated.name}).`,
      oldValue: { active: oldItem?.active },
      newValue: { active: updated.active }
    }).catch((e) => console.warn("Audit error:", e));
    res.json({
      success: true,
      message: `Statut du tarif mis \xE0 jour (${updated.active ? "Actif" : "Inactif"})`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

// server/routes/prices.ts
var pricesRouter = Router8();
pricesRouter.get("/", listPriceCategories);
pricesRouter.post("/:categoryId/items", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), savePriceItem);
pricesRouter.delete("/:categoryId/items/:itemId", authenticateJWT, requireRole(["ADMIN"]), deletePriceItem);
pricesRouter.patch("/:categoryId/items/:itemId/toggle", authenticateJWT, requireRole(["ADMIN", "EDITOR"]), togglePriceItem);

// server/routes/audit.ts
import { Router as Router9 } from "express";
var auditRouter = Router9();
auditRouter.use(authenticateJWT);
auditRouter.use(requireRole(["ADMIN"]));
auditRouter.get("/stats", (req, res) => {
  try {
    const stats = db.getAuditStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("[AUDIT ERROR] Erreur getAuditStats:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la r\xE9cup\xE9ration des statistiques d\u2019audit."
    });
  }
});
auditRouter.get("/", (req, res) => {
  try {
    const { resource, action, role, username, search, startDate, endDate, limit } = req.query;
    const parsedLimit = limit ? parseInt(limit, 10) : 200;
    const logs = db.getAllAuditLogs({
      resource,
      action,
      role,
      username,
      search,
      startDate,
      endDate,
      limit: parsedLimit
    });
    return res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("[AUDIT ERROR] Erreur getAllAuditLogs:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la r\xE9cup\xE9ration du journal d\u2019audit."
    });
  }
});
auditRouter.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const log = db.getAuditLogById(id);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Entr\xE9e du journal d\u2019audit introuvable."
      });
    }
    return res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error("[AUDIT ERROR] Erreur getAuditLogById:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la lecture de l\u2019entr\xE9e d\u2019audit."
    });
  }
});

// server/app.ts
initUploadDirectories();
var app = express();
app.set("trust proxy", 1);
app.use((req, _res, next) => {
  if (req.originalUrl && (req.url === "/api/index.js" || req.url === "/api" || !req.url.startsWith("/api"))) {
    req.url = req.originalUrl;
  }
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/uploads")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(csrfProtection);
app.use("/uploads/portfolio", express.static(PORTFOLIO_UPLOADS_DIR));
app.use("/uploads/quotes", (_req, res) => {
  res.status(403).json({
    success: false,
    error: "Acc\xE8s interdit. Les fichiers de devis sont strictement confidentiels."
  });
});
app.use(["/api/auth", "/auth"], authRouter);
app.use(["/api/health", "/health"], healthRouter);
app.use(["/api/company", "/company"], companyRouter);
app.use(["/api/stats", "/stats"], statsRouter);
app.use(["/api/quotes", "/quotes"], quotesRouter);
app.use(["/api/contact", "/contact"], contactRouter);
app.use(["/api/portfolio", "/portfolio"], portfolioRouter);
app.use(["/api/services", "/services"], servicesRouter);
app.use(["/api/prices", "/prices"], pricesRouter);
app.use(["/api/audit", "/audit"], auditRouter);
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint API introuvable : ${req.method} ${req.originalUrl || req.url}`
  });
});
app.use(globalErrorHandler);

// server/serverless.ts
var serverless_default = app;
export {
  serverless_default as default
};
