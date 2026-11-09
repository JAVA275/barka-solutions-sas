# 🗄️ GUIDE POUR LE STOCKAGE EXTERNE DES FICHIERS EN PRODUCTION SERVERLESS
## BARKA SOLUTIONS S.A.S — Pièces Jointes Devis & Images Portfolio

---

### 1. COMPRENDRE LE FONCTIONNEMENT DU DISQUE SERVERLESS (VERCEL)

Dans un environnement serverless comme Vercel :
- Le système de fichiers principal (`process.cwd()`) est monté en lecture seule (`EROFS - Read-Only File System`). Aucun fichier ne peut y être écrit dynamiquement pendant l'exécution d'une fonction lambda.
- Seul le répertoire `/tmp` est accessible en écriture (jusqu'à 512 Mo à 1 Go selon l'offre).
- **Conséquence critique :** Le dossier `/tmp` est éphémère. Chaque nouvelle instance ou "cold start" dispose d'un `/tmp` vierge. Les fichiers clients téléversés dans `/tmp` ne subsistent pas lors du recyclage des conteneurs.

Pour un fonctionnement d'entreprise pérenne et illimité, il est indispensable de relier un service de **Stockage Objet Cloud (Object Storage S3-compatible)**.

---

### 2. COMPARATIF DES SOLUTIONS DE STOCKAGE COMPATIBLES

| Service | Tarification & Quota Gratuit | Egress (Frais de sortie) | Avantages Clés |
| :--- | :--- | :--- | :--- |
| **Cloudflare R2** *(Fortement Recommandé)* | 10 Go gratuits / mois | **0 € (Zéro frais de bande passante)** | Compatible API S3 standard, ultra-économique, CDN Cloudflare mondial intégré. |
| **Vercel Blob** | 1 Go gratuit | Inclus dans Vercel | Intégration native sans clé AWS en 3 lignes de code (`@vercel/blob`). |
| **AWS S3** | 5 Go pendant 12 mois | Payant au-delà | Standard de l'industrie, certifications ISO/SOC2. |
| **Supabase Storage** | 1 Go gratuit | Inclus | Directement relié à votre base PostgreSQL Supabase. |

---

### 3. ARCHITECTURE DE STOCKAGE RECOMMANDÉE : CLOUDFLARE R2 / AWS S3

#### A. Principe de Ségrégation Public / Privé
1. **Fichiers Devis Clients (`quotes`) — PRIVÉ :**
   - Les documents techniques (PDF, fichiers Illustrator AI, maquettes Photoshop PSD, archives ZIP) sont stockés dans un bucket privé ou un sous-dossier non public.
   - Ils ne sont **JAMAIS** accessibles directement par une URL publique.
   - Le téléchargement s'effectue exclusivement via la route sécurisée de l'application :
     `GET /api/quotes/:quoteId/files/:fileId`
     Cette route contrôle l'authentification de l'administrateur, vérifie ses droits (RBAC), et génère une URL signée temporaire (Pre-signed URL de 15 minutes) ou transmet le flux de données.

2. **Images du Portfolio (`portfolio`) — PUBLIC :**
   - Les images de réalisations imprimées (JPG, PNG, WEBP) sont hébergées dans un sous-dossier public ou exposées via un domaine personnalisé CDN (ex: `https://cdn.barkasolutions.org/portfolio/...`).

---

### 4. IMPLÉMENTATION PAS À PAS AVEC LE SDK S3 STANDARD (`@aws-sdk/client-s3`)

Si vous souhaitez activer le stockage cloud direct :

#### Étape 1 : Installation du SDK léger
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Étape 2 : Configuration des Variables d'Environnement
Dans votre console Vercel ou fichier `.env` :
```env
S3_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
S3_BUCKET_NAME="barka-production-uploads"
S3_REGION="auto"
S3_ACCESS_KEY_ID="votre_access_key_id"
S3_SECRET_ACCESS_KEY="votre_secret_access_key"
S3_PUBLIC_DOMAIN="https://pub-xxxxxx.r2.dev"
```

#### Étape 3 : Exemple de Service Cloud de Téléversement (`server/services/s3Storage.ts`)
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToStorage(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(command);
  return `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
}

export async function getSecureDownloadUrl(key: string, fileName: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });
  // URL temporaire valable 15 minutes uniquement pour l'administrateur
  return await getSignedUrl(s3, command, { expiresIn: 900 });
}
```

---

### 5. SITUATION ACTUELLE DE L'APPLICATION
Dans la version actuelle :
- Sur Vercel, l'application écrit automatiquement dans `/tmp/uploads` grâce à la détection de `process.env.VERCEL`.
- Les fichiers restent accessibles durant la vie du conteneur.
- La transition vers S3/R2 ne nécessite aucune modification sur le frontend React, les composants ou les routes d'API qui conservent exactement leurs contrats d'interface.
