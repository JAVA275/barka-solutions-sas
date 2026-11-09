# 🚀 GUIDE DE DÉPLOIEMENT EN PRODUCTION SUR VERCEL
## BARKA SOLUTIONS S.A.S — React + Express Serverless

---

### 1. ARCHITECTURE HYBRIDE SUR VERCEL

L'application utilise l'architecture hybride moderne de Vercel :
1. **Frontend React SPA** : Compilé en amont par Vite dans le dossier `dist/`. Servi par le CDN mondial Edge de Vercel avec mise en cache ultra-rapide des assets statiques (`assets/*.js`, `assets/*.css`, images du dossier `public/`).
2. **Backend API Express** : Servi par la fonction serverless unique `api/index.ts` qui encapsule l'application Express unifiée `server/app.ts`.

---

### 2. CONFIGURATION DU FICHIER `vercel.json`

Le fichier `vercel.json` à la racine configure le routage, les en-têtes de sécurité et les règles de réécriture (Rewrites) :

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/uploads/portfolio/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/uploads/quotes/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/robots.txt",
      "destination": "/robots.txt"
    },
    {
      "source": "/sitemap.xml",
      "destination": "/sitemap.xml"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

### 3. ÉTAPES PAS À PAS POUR DÉPLOYER SUR VERCEL

#### Étape 1 : Connexion au Dépôt GitHub
1. Rendez-vous sur votre console [Vercel Dashboard](https://vercel.com/dashboard).
2. Cliquez sur **"Add New..."** > **"Project"**.
3. Importez le dépôt : `JAVA275/barka-solutions-sas`.

#### Étape 2 : Configuration du Projet (Build & Output Settings)
Vercel détecte automatiquement la configuration grâce à `package.json` :
- **Framework Preset** : `Vite`
- **Root Directory** : `./` (la racine)
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

#### Étape 3 : Définition des Variables d'Environnement Obligatoires
Dans l'onglet **"Environment Variables"** de votre projet Vercel, ajoutez impérativement :

| Nom de la Variable | Valeur Recommandée / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Clé secrète cryptographique générée aléatoirement (au moins 32 caractères). Exemple : `barka_sec_2026_x89a_99ef_44cb_88dc_0012` |
| `JWT_EXPIRES_IN` | `8h` |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL de production avec SSL. Exemple : `postgresql://user:pass@ep-cool-fog.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
| `APP_URL` | URL définitive de production (ex: `https://barka-solutions-sas.vercel.app` ou domaine personnalisé) |
| `ADMIN_NOTIFICATION_EMAILS` | `direction@barkasolutions.org,kouchoumichel@yahoo.fr` |

Variables de messagerie (Optionnel mais recommandé pour les alertes de devis) :
- Si SMTP : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Si Resend : `RESEND_API_KEY`.
- Si Brevo : `BREVO_API_KEY`.

#### Étape 4 : Lancer le Déploiement
1. Cliquez sur **"Deploy"**.
2. Vercel compile le frontend via Vite et packagera la fonction serverless `api/index.ts`.
3. Une fois terminé, le statut passera à **"Ready"** avec l'attribution d'un domaine HTTPS sécurisé.

---

### 4. VALIDATION POST-DÉPLOIEMENT

Après déploiement, vérifiez immédiatement :

1. **Test de l'endpoint Health Check** :
   ```bash
   curl -i https://barka-solutions-sas.vercel.app/api/health
   ```
   Doit renvoyer `HTTP 200` avec `"database": { "connected": true }`.

2. **Test des en-têtes de sécurité HTTP** :
   Vérifiez la présence de `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, et `Strict-Transport-Security`.

3. **Connexion Espace Admin** :
   Accédez à `https://barka-solutions-sas.vercel.app/admin/login` et connectez-vous avec vos identifiants administrateurs.
   Vérifiez que le cookie `barka_auth_token` est bien marqué `HttpOnly`, `Secure` et `SameSite`.
