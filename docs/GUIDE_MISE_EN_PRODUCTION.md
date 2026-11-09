# 🚀 GUIDE MAÎTRE DE MISE EN PRODUCTION PAS À PAS
## BARKA SOLUTIONS S.A.S — Déploiement Complet, Sécurisé & Clé en Main

---

### 1. CHECKLIST PRÉALABLE AU DÉPLOIEMENT

Avant de démarrer le déploiement sur votre infrastructure de production :

- [x] **Règle #1 Frontend** : Le design, les composants visuels, l'expérience utilisateur et les fonctionnalités métier sont strictement conservés sans altération.
- [x] **Authentification Sécurisée** : Les sessions utilisent des cookies `HttpOnly`, `Secure` et `SameSite`. Les tokens JWT ne sont plus stockés dans le `localStorage`.
- [x] **Révocation Persistante** : Table `revoked_tokens` créée dans PostgreSQL avec cache L1 en mémoire vive.
- [x] **Sécurité des Uploads** : Les fichiers téléversés sont vérifiés par octets magiques réels (Magic Bytes) et les SVG sont assainis contre les attaques XSS et XXE.
- [x] **Sécurité Réseau & HTTP** : Middleware d'en-têtes HTTP de sécurité (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) et protection anti-CSRF actifs.
- [x] **Tests Automatisés** : 36/36 tests réussis avec un taux de succès de 100%.

---

### 2. ÉTAPE 1 : PROVISIONNER LA BASE DE DONNÉES POSTGRESQL

1. Rendez-vous sur [Neon.tech](https://neon.tech) ou [Supabase.com](https://supabase.com).
2. Créez un nouveau projet de base de données nommé `barka-solutions-prod`.
3. Choisissez une région géographique proche de vos utilisateurs (ex: `Frankfurt (eu-central-1)` ou `Paris`).
4. Récupérez la chaîne de connexion (Connection String) avec SSL activé :
   `postgresql://utilisateur:motdepasse@ep-cool-fog-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require`

---

### 3. ÉTAPE 2 : EXÉCUTER LE SCHÉMA SQL INITIAL

Dans un terminal local connecté à votre base ou depuis l'éditeur SQL de votre console Neon/Supabase :
1. Ouvrez le fichier `server/db/schema.sql`.
2. Exécutez le script complet. Il créera l'ensemble des tables :
   - `users`
   - `company_settings`
   - `services`
   - `price_categories`
   - `price_grid_items`
   - `portfolio`
   - `quotes`
   - `messages`
   - `audit_logs`
   - `revoked_tokens`
   - Index de performance et de recherche instantanée.

---

### 4. ÉTAPE 3 : DÉPLOYER SUR VERCEL

1. Connectez-vous à [Vercel](https://vercel.com).
2. Cliquez sur **"Add New..."** > **"Project"** et sélectionnez le dépôt GitHub :
   `https://github.com/JAVA275/barka-solutions-sas`
3. Dans la section **"Environment Variables"**, renseignez les variables suivantes :

```env
NODE_ENV=production
JWT_SECRET=barka_super_secret_production_key_minimum_32_chars_2026!
JWT_EXPIRES_IN=8h
DATABASE_URL=postgresql://utilisateur:motdepasse@votre-hote-postgres:5432/nom_base?sslmode=require
APP_URL=https://votre-domaine-barka.vercel.app
ADMIN_NOTIFICATION_EMAILS=direction@barkasolutions.org,kouchoumichel@yahoo.fr
```

Pour les emails de devis (choisir votre fournisseur) :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@barkasolutions.org
SMTP_PASS=votre_mot_de_passe_application_google
SMTP_FROM=BARKA SOLUTIONS S.A.S <direction@barkasolutions.org>
```

4. Cliquez sur **"Deploy"**.
5. Vercel compile le frontend Vite et génère la fonction serverless unifiée.

---

### 5. ÉTAPE 4 : VALIDATION ET CONTRÔLE DE PRODUCTION

Dès que le déploiement est terminé :

1. **Contrôle de l'API Health :**
   Ouvrez dans votre navigateur ou via terminal :
   `https://votre-domaine.vercel.app/api/health`
   Vérifiez que la réponse affiche :
   `"status": "ok"` et `"database": { "connected": true, "mode": "POSTGRESQL" }`.

2. **Test de l'Espace d'Administration :**
   Accédez à :
   `https://votre-domaine.vercel.app/admin/login`
   Connectez-vous. Vérifiez l'accès aux statistiques, à la gestion des devis, au portfolio et aux journaux d'audit.

3. **Vérification du Cookie Sécurisé :**
   Ouvrez la console de développement de votre navigateur (F12) > Onglet **Application** > **Cookies** :
   Le cookie `barka_auth_token` doit comporter les drapeaux :
   - `HttpOnly` : Coche verte
   - `Secure` : Coche verte
   - `SameSite` : Strict (ou Lax)

4. **Test de Soumission de Devis Public :**
   Depuis la page d'accueil, soumettez une demande de devis avec pièce jointe (PDF ou image).
   Vérifiez que le devis est bien enregistré avec son numéro séquentiel `BKS-AAAA-XXXXX` et que la notification est transmise aux administrateurs.
