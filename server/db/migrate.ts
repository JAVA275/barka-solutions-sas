import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCleanConnectionString(url?: string): string | undefined {
  if (!url) return undefined;
  let clean = url.trim();
  if (clean.startsWith('DATABASE_URL=')) {
    clean = clean.replace('DATABASE_URL=', '').trim();
  }
  if (clean.includes('utilisateur:motdepasse') || clean.includes('nom_de_la_base')) {
    return undefined;
  }
  return clean;
}

export async function runMigrations(): Promise<boolean> {
  const connStr = getCleanConnectionString(process.env.DATABASE_URL);
  if (!connStr) {
    console.log('ℹ️ [Migration] Aucun DATABASE_URL PostgreSQL valide configuré. Mode local/mémoire actif.');
    return false;
  }

  const isSslNeeded = connStr.includes('sslmode=require') || !connStr.includes('localhost');
  const pool = new Pool({
    connectionString: connStr,
    ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔄 [Migration] Connexion à PostgreSQL et exécution des migrations...');
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Fichier de schéma introuvable : ${schemaPath}`);
    }

    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(sql);
    console.log('✅ [Migration] Schéma PostgreSQL appliqué avec succès !');
    await pool.end();
    return true;
  } catch (err: any) {
    console.error('❌ [Migration] Échec de l’application des migrations :', err.message);
    await pool.end().catch(() => {});
    return false;
  }
}

// If executed directly via `tsx server/db/migrate.ts`
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().then(() => {
    process.exit(0);
  });
}
