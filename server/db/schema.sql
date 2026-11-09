-- ==========================================================
-- BARKA SOLUTIONS S.A.S — SCHÉMA DE BASE DE DONNÉES POSTGRESQL
-- Version: 3.0 (Normalisée, PostgreSQL natif & Robuste)
-- ==========================================================

-- 1. Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Énumérations
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM (
        'NOUVEAU',
        'EN_ANALYSE',
        'DEVIS_EN_PREPARATION',
        'DEVIS_ENVOYE',
        'EN_ATTENTE_CLIENT',
        'ACCEPTE',
        'EN_PRODUCTION',
        'TERMINE',
        'ANNULE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE price_type AS ENUM ('FIXED', 'STARTING_AT', 'CUSTOM_QUOTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Table des Utilisateurs Administrateurs & Éditeurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'EDITOR',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Paramètres de l'Entreprise (Source Unique de Vérité)
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL DEFAULT 'BARKA SOLUTIONS S.A.S',
    legal_name VARCHAR(200) NOT NULL DEFAULT 'BARKA SOLUTIONS Société par Actions Simplifiée (S.A.S)',
    tagline VARCHAR(200) DEFAULT 'Imprimerie & Multiservices',
    slogan VARCHAR(255) DEFAULT 'L''excellence maîtrisée',
    address TEXT NOT NULL DEFAULT 'Derrière le Restaurant Le Verger, Ngaoundéré, Cameroun',
    city VARCHAR(100) NOT NULL DEFAULT 'Ngaoundéré',
    country VARCHAR(100) NOT NULL DEFAULT 'Cameroun',
    phone_primary VARCHAR(30) NOT NULL DEFAULT '+237 696 311 198',
    phone_secondary VARCHAR(30) DEFAULT '+237 690 084 142',
    whatsapp VARCHAR(30) NOT NULL DEFAULT '+237 696 311 198',
    whatsapp_raw VARCHAR(30) DEFAULT '237696311198',
    email_primary VARCHAR(150) NOT NULL DEFAULT 'kouchoumichel@yahoo.fr',
    email_secondary VARCHAR(150) DEFAULT 'direction@barkasolutions.org',
    website VARCHAR(255) DEFAULT '',
    logo_url TEXT DEFAULT '/assets/logo-barka.png',
    opening_hours JSONB NOT NULL DEFAULT '{"weekday": "Lundi - Vendredi : 08h00 – 18h00", "saturday": "Samedi : 08h00 – 13h00", "sunday": "Fermé (Permanence WhatsApp 24/7)"}',
    social_links JSONB NOT NULL DEFAULT '{"whatsapp": "https://wa.me/237696311198", "email": "mailto:direction@barkasolutions.org"}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Catégories de Services
CREATE TABLE IF NOT EXISTS service_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- 6. Services & Prestations
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) DEFAULT 'imprimerie',
    group_title VARCHAR(100) DEFAULT 'Imprimerie',
    category VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    short_desc TEXT NOT NULL,
    full_desc TEXT,
    icon_name VARCHAR(50) DEFAULT 'Printer',
    image_url TEXT,
    price_starting_at NUMERIC(12, 2) DEFAULT 0,
    popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]',
    sample_deliverables JSONB DEFAULT '[]',
    quote_type_prestation VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Catégories de Réalisations (Portfolio)
CREATE TABLE IF NOT EXISTS portfolio_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 8. Réalisations / Portfolio
CREATE TABLE IF NOT EXISTS portfolio (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    categories JSONB DEFAULT '[]',
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    client VARCHAR(150),
    year VARCHAR(10),
    tags JSONB DEFAULT '[]',
    service_associe VARCHAR(150),
    service_id VARCHAR(50),
    featured BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Catégories de Prix
CREATE TABLE IF NOT EXISTS price_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'BookOpen',
    description TEXT,
    sort_order INT DEFAULT 0
);

-- 10. Grille Tarifaire / Articles de Prix
CREATE TABLE IF NOT EXISTS prices (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES price_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    format VARCHAR(50),
    specs TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'FCFA',
    price_type price_type NOT NULL DEFAULT 'FIXED',
    popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    min_qty INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Demandes de Devis (Quotes)
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(50) PRIMARY KEY, -- ex: BKS-2026-00001
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    nom_complet VARCHAR(200) NOT NULL,
    entreprise VARCHAR(150) DEFAULT 'Particulier',
    telephone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    ville VARCHAR(100) NOT NULL DEFAULT 'Ngaoundéré',
    type_prestation VARCHAR(100) NOT NULL,
    produit VARCHAR(150),
    quantite INT NOT NULL DEFAULT 1,
    format VARCHAR(100) DEFAULT 'Standard',
    support_papier VARCHAR(100),
    grammage VARCHAR(50),
    impression_type VARCHAR(50) DEFAULT 'Recto seul',
    finition VARCHAR(150) DEFAULT 'Standard',
    delai VARCHAR(50) DEFAULT 'Standard (3-5 jours)',
    livraison_option VARCHAR(100) DEFAULT 'Retrait en agence (Ngaoundéré)',
    graphisme_option VARCHAR(100) DEFAULT 'Fichier prêt fourni (HD)',
    description TEXT,
    estimated_price NUMERIC(12, 2) DEFAULT 0,
    price_type VARCHAR(50) DEFAULT 'STARTING_AT',
    final_price NUMERIC(12, 2),
    status quote_status NOT NULL DEFAULT 'NOUVEAU',
    admin_notes TEXT,
    files JSONB DEFAULT '[]',
    status_history JSONB DEFAULT '[]',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Articles détaillés dans un devis (optionnel pour devis multi-lignes)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id VARCHAR(50) NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    designation VARCHAR(200) NOT NULL,
    format VARCHAR(100),
    support VARCHAR(100),
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 13. Fichiers joints aux devis
CREATE TABLE IF NOT EXISTS quote_files (
    id VARCHAR(100) PRIMARY KEY,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Messages de Contact & Demandes d'info
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(50) PRIMARY KEY, -- ex: MSG-001
    name VARCHAR(150) NOT NULL,
    email_or_phone VARCHAR(150) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Témoignages Clients
CREATE TABLE IF NOT EXISTS testimonials (
    id VARCHAR(50) PRIMARY KEY,
    author VARCHAR(150) NOT NULL,
    role VARCHAR(100),
    company VARCHAR(150),
    avatar_url TEXT,
    comment TEXT NOT NULL,
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    date_label VARCHAR(50),
    project VARCHAR(150),
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Notifications Système
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'QUOTE', 'MESSAGE', 'STATUS_CHANGE'
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Clés de configuration génériques / Métadonnées
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Journal d'Audit Administratif (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    username VARCHAR(100) NOT NULL,
    user_full_name VARCHAR(150),
    role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    resource_title VARCHAR(200),
    description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Table des Jetons Révoqués (Persistance de Révocation / Blacklist Serverless)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100) DEFAULT 'LOGOUT'
);

-- Index pour performances de recherche
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_submitted_at ON quotes(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_portfolio_active ON portfolio(active);
CREATE INDEX IF NOT EXISTS idx_prices_category ON prices(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);



