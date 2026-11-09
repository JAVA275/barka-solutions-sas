# 💾 PROCÉDURE DE SAUVEGARDE ET DE RESTAURATION DE LA BASE DE DONNÉES
## BARKA SOLUTIONS S.A.S — Plan de Continuité d'Activité (PCA / PRA)

---

### 1. OBJECTIFS DU PLAN DE SAUVEGARDE

Cette procédure garantit :
- **RPO (Recovery Point Objective)** : Moins de 24 heures (ou instantané si WAL continu / Point-in-Time Recovery actif).
- **RTO (Recovery Time Objective)** : Moins de 15 minutes pour restaurer l'intégralité du service en cas d'incident critique.
- **Intégrité Cryptographique** : Les mots de passe et sessions révoquées sont restaurés de manière cohérente.

---

### 2. SAUVEGARDE MANUELLE COMPLÈTE VIA CLI (`pg_dump`)

#### Commande de Sauvegarde (Format Binaire Compressé)
Le format binaire personnalisé (`-Fc`) est le plus robuste car il permet la restauration sélective des tables et compresse le volume de données :

```bash
# Définir l'URL de la base source
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Exécuter la sauvegarde horodatée
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="backup_barka_$(date +%Y%m%d_%H%M%S).dump"
```

#### Sauvegarde en Script SQL Brut (Texte Lisible)
Si vous souhaitez un fichier `.sql` directement lisible et modifiable :
```bash
pg_dump "$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --file="backup_barka_$(date +%Y%m%d_%H%M%S).sql"
```

---

### 3. RESTAURATION DE LA BASE DE DONNÉES (`pg_restore` & `psql`)

#### A. Restauration depuis un Dump Binaire (`.dump`)
```bash
# 1. Optionnel : Nettoyage préalable ou restauration directe
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  "backup_barka_20261109_163000.dump"
```

#### B. Restauration depuis un Fichier SQL Brut (`.sql`)
```bash
psql "$DATABASE_URL" -f "backup_barka_20261109_163000.sql"
```

---

### 4. SAUVEGARDE AUTOMATISÉE QUOTIDIENNE (EXEMPLE GITHUB ACTIONS / CRON)

Vous pouvez configurer un workflow GitHub Actions sécurisé exécuté chaque nuit à 02h00 UTC :

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Tous les jours à 02:00 UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL Tools
        run: sudo apt-get update && sudo apt-get install -y postgresql-client

      - name: Create Backup Dump
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          mkdir -p ./backups
          BACKUP_FILE="./backups/barka_backup_$(date +%Y%m%d_%H%M%S).dump"
          pg_dump "$DATABASE_URL" -Fc -Z 9 -f "$BACKUP_FILE"
          echo "BACKUP_FILE=$BACKUP_FILE" >> $GITHUB_ENV

      - name: Upload to Secure Cloud Storage (AWS S3 / Cloudflare R2)
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_S3_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_S3_SECRET_KEY }}
        run: |
          aws s3 cp "${{ env.BACKUP_FILE }}" s3://barka-backups/database/ --endpoint-url https://${{ secrets.CLOUDFLARE_ACCOUNT_ID }}.r2.cloudflarestorage.com
```

---

### 5. PLAN DE REPRISE EN CAS D'URGENCE (CRASH RECOVERY)

En cas de corruption de données ou de suppression accidentelle :

1. **Geler temporairement l'application** :
   Dans la console Vercel, vous pouvez activer le mode maintenance ou suspendre le déploiement.
2. **Provisionner une base de secours** (ex: sur Neon ou Supabase).
3. **Restaurer le dernier dump valide** sur la nouvelle base.
4. **Mettre à jour la variable `DATABASE_URL`** dans les paramètres d'environnement Vercel.
5. **Redéployer l'application** :
   Vercel propagera immédiatement la nouvelle chaîne de connexion à l'ensemble des conteneurs serverless.
6. **Vérifier l'endpoint de contrôle** :
   ```bash
   curl https://barka-solutions-sas.vercel.app/api/health
   ```
   Confirmer que le statut renvoie `"status": "ok"` et `"connected": true`.
