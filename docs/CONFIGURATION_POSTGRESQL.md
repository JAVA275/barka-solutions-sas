# 🐘 GUIDE DE CONFIGURATION POSTGRESQL EN PRODUCTION
## BARKA SOLUTIONS S.A.S — Architecture & Déploiement

---

### 1. PRÉSENTATION GÉNÉRALE

En environnement de production (notamment avec les fonctions Serverless Vercel), la base de données **PostgreSQL** est le garant exclusif de la persistance des données. 

Elle stocke :
- Les comptes d'accès administratifs (`users`) avec mots de passe hachés en Bcrypt (coût 12).
- Les demandes de devis clients (`quotes`), références séquentielles et métadonnées de fichiers.
- Les messages de contact (`messages`) et réponses de l'équipe commerciale.
- Le catalogue des services (`services`) et grilles tarifaires dynamiques (`price_categories`, `price_grid_items`).
- Le portfolio des réalisations graphiques et d'impression (`portfolio`).
- Les paramètres de l'entreprise (`company_settings`).
- Les journaux d'audit de sécurité (`audit_logs`).
- **Nouveau :** La table de révocation persistante des tokens de session (`revoked_tokens`).

---

### 2. CHOIX D'UN FOURNISSEUR POSTGRESQL ADAPTÉ AU SERVERLESS

Pour un déploiement fluide sur Vercel, nous recommandons un fournisseur PostgreSQL compatible **Connection Pooling (PgBouncer)** :

| Fournisseur | Offre Recommandée | Caractéristiques | URL de Connexion Typique |
| :--- | :--- | :--- | :--- |
| **Neon.tech** *(Recommandé)* | Serverless Postgres | Démarrage instantané, connection pooler intégré port 5432 / 6543, SSL natif | `postgresql://user:pass@ep-cool-fog.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
| **Supabase** | Cloud Postgres | Pooler Transactionnel PgBouncer sur le port 6543 | `postgresql://postgres:pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| **Railway** | Managed Postgres | Conteneur persistant haute disponibilité | `postgresql://postgres:pass@roundhouse.proxy.rlwy.net:12345/railway?sslmode=require` |
| **AWS RDS / Aurora** | Serverless v2 | RDS Proxy obligatoire pour amortir les connexions courtes | `postgresql://dbadmin:pass@barka-rds-proxy.endpoint.amazonaws.com:5432/barkadb?sslmode=require` |

---

### 3. EXÉCUTION DU SCHÉMA & DES MIGRATIONS SQL

Le schéma complet est défini dans `server/db/schema.sql`.

#### Méthode 1 : Migration Automatique au Démarrage
L'application exécute automatiquement les migrations du schéma si la base est joignable lors de son initialisation via `pgManager.runMigrations()`. Si la base est vierge, elle amorce également les données par défaut depuis `server/data/store.json`.

#### Méthode 2 : Migration Manuelle via CLI
Vous pouvez exécuter le script de migration dédié :
```bash
# Définir l'URL de la base distante
export DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# Lancer la migration
npm run db:migrate
```

#### Méthode 3 : Import Direct via psql
```bash
psql "postgresql://user:pass@host:5432/dbname?sslmode=require" -f server/db/schema.sql
```

---

### 4. DÉTAIL DU SCHÉMA SQL DE SÉCURITÉ

#### Structure de la Table `revoked_tokens`
```sql
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) UNIQUE NOT NULL, -- Hachage SHA-256 du token JWT
    user_id VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(50) DEFAULT 'LOGOUT'
);

-- Index pour recherche instantanée O(1) lors de chaque requête HTTP
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash);
-- Index pour le nettoyage automatique des sessions expirées
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
```

#### Structure de la Table `audit_logs`
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    resource_title VARCHAR(255),
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
```

---

### 5. DIMENSIONNEMENT DU POOL DE CONNEXIONS (POOL SIZING)

Dans `server/db/postgres.ts`, le pool client `pg.Pool` est optimisé pour les environnements mixtes :
- `max: 20` connexions maximales par instance active.
- `connectionTimeoutMillis: 5000` (délai d'attente maximum de 5 secondes pour éviter le blocage des requêtes HTTP).
- `idleTimeoutMillis: 30000` (fermeture propre des sockets inactifs après 30s).
- `ssl: { rejectUnauthorized: false }` requis pour les fournisseurs cloud utilisant des certificats gérés.

---

### 6. CONTRÔLE DE SANTÉ (`HEALTH CHECK`)
L'endpoint `/api/health` fournit en temps réel l'état du sous-système de persistance :
```bash
curl -i https://barka-solutions-sas.vercel.app/api/health
```
Réponse attendue :
```json
{
  "status": "ok",
  "app": "BARKA SOLUTIONS API",
  "version": "1.0.0",
  "database": {
    "mode": "POSTGRESQL",
    "connected": true
  },
  "serverTime": "2026-11-09T15:42:00.000Z"
}
```
Si la base est coupée ou indisponible en production, le serveur renvoie immédiatement HTTP 503 :
```json
{
  "status": "error",
  "app": "BARKA SOLUTIONS API",
  "code": "DATABASE_UNAVAILABLE",
  "error": "Base de données PostgreSQL requise en production mais actuellement indisponible."
}
```
