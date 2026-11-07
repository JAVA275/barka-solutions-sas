import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function recordPass(category: string, name: string, details?: any) {
  results.push({ category, name, passed: true, details });
  console.log(`  ✅ [PASS] [${category}] ${name}`);
}

function recordFail(category: string, name: string, error: string, details?: any) {
  results.push({ category, name, passed: false, error, details });
  console.error(`  ❌ [FAIL] [${category}] ${name}: ${error}`);
}

async function createMultipartFormData(
  fields: Record<string, string>,
  files?: Array<{ fieldName: string; fileName: string; content: Buffer; contentType: string }>
) {
  const formData = new FormData();
  for (const [key, val] of Object.entries(fields)) {
    formData.append(key, val);
  }
  if (files) {
    for (const f of files) {
      const blob = new Blob([f.content], { type: f.contentType });
      formData.append(f.fieldName, blob, f.fileName);
    }
  }
  return formData;
}

let ipCounter = 100;
function getTestIp() {
  ipCounter++;
  return `10.200.15.${ipCounter}`;
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🚀 DÉMARRAGE DE L’AUDIT COMPLET DES TESTS - BARKA SOLUTIONS S.A.S');
  console.log('===============================================================\n');

  const runId = Date.now();
  const testAdminUser = `test_admin_${runId}`;
  const testAdminPass = `AdminPass_${runId}!`;
  const testEditorUser = `test_editor_${runId}`;
  const testEditorPass = `EditorPass_${runId}!`;
  const testLogoutUser = `test_logout_${runId}`;
  const testLogoutPass = `LogoutPass_${runId}!`;

  let adminToken = '';
  let editorToken = '';
  let logoutToken = '';
  let createdServiceId = '';
  let createdPriceItemId = '';
  let createdPortfolioId = '';
  let createdQuoteId = '';
  let createdQuoteFileId = '';

  // --------------------------------------------------------------------------
  // 1. AUTH TESTS
  // --------------------------------------------------------------------------
  console.log('🔹 1. TESTS AUTH (Authentification & Sécurité RBAC)');

  try {
    const { db } = await import('../server/db/database.js');
    const { hashPassword } = await import('../server/services/auth.js');

    const adminHash = await hashPassword(testAdminPass);
    const editorHash = await hashPassword(testEditorPass);
    const logoutHash = await hashPassword(testLogoutPass);

    await db.createUser({
      username: testAdminUser,
      email: `${testAdminUser}@test.cm`,
      passwordHash: adminHash,
      fullName: 'Test Admin Auditor',
      role: 'ADMIN',
      isActive: true,
    });

    await db.createUser({
      username: testEditorUser,
      email: `${testEditorUser}@test.cm`,
      passwordHash: editorHash,
      fullName: 'Test Editor Auditor',
      role: 'EDITOR',
      isActive: true,
    });

    await db.createUser({
      username: testLogoutUser,
      email: `${testLogoutUser}@test.cm`,
      passwordHash: logoutHash,
      fullName: 'Test Logout User',
      role: 'EDITOR',
      isActive: true,
    });
  } catch (err: any) {
    console.error('Error pre-seeding test users:', err);
  }

  // 1.1 Login ADMIN
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({ username: testAdminUser, password: testAdminPass }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.token && data.user?.role === 'ADMIN') {
      adminToken = data.token;
      recordPass('AUTH', 'login (rôle ADMIN)');
    } else {
      recordFail('AUTH', 'login (rôle ADMIN)', `Status ${res.status}: ${data.error || 'No token returned'}`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'login (rôle ADMIN)', err.message);
  }

  // 1.2 Login EDITOR
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({ username: testEditorUser, password: testEditorPass }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.token && data.user?.role === 'EDITOR') {
      editorToken = data.token;
      recordPass('AUTH', 'login (rôle EDITOR)');
    } else {
      recordFail('AUTH', 'login (rôle EDITOR)', `Status ${res.status}: ${data.error || 'No token returned'}`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'login (rôle EDITOR)', err.message);
  }

  // 1.3 Mauvais mot de passe
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({ username: testAdminUser, password: 'WRONG_PASSWORD_12345' }),
    });
    const data = await res.json();
    if (res.status === 401 && !data.success) {
      recordPass('AUTH', 'mauvais mot de passe');
    } else {
      recordFail('AUTH', 'mauvais mot de passe', `Attendu 401, reçu ${res.status}`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'mauvais mot de passe', err.message);
  }

  // 1.4 Rôle ADMIN - Accès route admin
  try {
    const res = await fetch(`${BASE_URL}/api/auth/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}`, 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.data)) {
      recordPass('AUTH', 'rôle ADMIN');
    } else {
      recordFail('AUTH', 'rôle ADMIN', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'rôle ADMIN', err.message);
  }

  // 1.5 Rôle EDITOR - Accès route autorisée
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${editorToken}`, 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user?.role === 'EDITOR') {
      recordPass('AUTH', 'rôle EDITOR');
    } else {
      recordFail('AUTH', 'rôle EDITOR', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'rôle EDITOR', err.message);
  }

  // 1.6 Accès interdit (EDITOR tente d'accéder à route ADMIN)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${editorToken}`, 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 403 && !data.success) {
      recordPass('AUTH', 'accès interdit');
    } else {
      recordFail('AUTH', 'accès interdit', `Attendu 403, reçu ${res.status}`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'accès interdit', err.message);
  }

  // 1.7 Logout (Révocation de session)
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({ username: testLogoutUser, password: testLogoutPass }),
    });
    const loginData = await loginRes.json();
    logoutToken = loginData.token;

    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${logoutToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
    });
    const data = await res.json();

    const verifyRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${logoutToken}`, 'x-forwarded-for': getTestIp() },
    });

    if (res.status === 200 && data.success && verifyRes.status === 401) {
      recordPass('AUTH', 'logout');
    } else {
      recordFail('AUTH', 'logout', `Token encore accepté après logout (${verifyRes.status})`);
    }
  } catch (err: any) {
    recordFail('AUTH', 'logout', err.message);
  }

  // --------------------------------------------------------------------------
  // 2. SERVICES TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 2. TESTS SERVICES');

  // 2.1 Affichage public des services
  try {
    const res = await fetch(`${BASE_URL}/api/services`, {
      headers: { 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
      recordPass('SERVICES', 'affichage public');
    } else {
      recordFail('SERVICES', 'affichage public', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('SERVICES', 'affichage public', err.message);
  }

  // 2.2 Création de service
  try {
    const res = await fetch(`${BASE_URL}/api/services`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({
        groupId: 'imprimerie',
        groupTitle: 'Pôle Imprimerie Offset & Numérique',
        category: 'Offset',
        title: `Service Test Audit ${runId}`,
        shortDesc: 'Impression professionnelle haute définition test',
        fullDesc: 'Description complète du service de test pour l’audit qualité',
        priceStartingAt: 7500,
        popular: false,
        active: true,
        features: ['Format A4/A3', 'Papier couché 300g'],
        sampleDeliverables: ['BAT numérique', 'Livraison sous 48h'],
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.id) {
      createdServiceId = data.data.id;
      recordPass('SERVICES', 'création');
    } else {
      recordFail('SERVICES', 'création', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('SERVICES', 'création', err.message);
  }

  // 2.3 Modification de service
  try {
    const res = await fetch(`${BASE_URL}/api/services/${createdServiceId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({
        title: `Service Test Audit Mis à Jour ${runId}`,
        priceStartingAt: 9900,
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data?.title?.includes('Mis à Jour')) {
      recordPass('SERVICES', 'modification');
    } else {
      recordFail('SERVICES', 'modification', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('SERVICES', 'modification', err.message);
  }

  // 2.4 Suppression de service
  try {
    const res = await fetch(`${BASE_URL}/api/services/${createdServiceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}`, 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success) {
      recordPass('SERVICES', 'suppression');
    } else {
      recordFail('SERVICES', 'suppression', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('SERVICES', 'suppression', err.message);
  }

  // --------------------------------------------------------------------------
  // 3. TARIFS TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 3. TESTS TARIFS');

  let targetCategoryId = 'cat-papeterie';

  // 3.1 Affichage public
  try {
    const res = await fetch(`${BASE_URL}/api/prices`, {
      headers: { 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
      targetCategoryId = data.data[0].id;
      recordPass('TARIFS', 'affichage public');
    } else {
      recordFail('TARIFS', 'affichage public', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('TARIFS', 'affichage public', err.message);
  }

  // 3.2 Création de tarif
  try {
    const res = await fetch(`${BASE_URL}/api/prices/${targetCategoryId}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({
        name: `Cartes Luxe Test ${runId}`,
        format: '8.5 x 5.5 cm',
        unit: 'pièce',
        unitPrice: 175,
        minQuantity: 200,
        active: true,
        delai: '24h',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data?.id) {
      createdPriceItemId = data.data.id;
      recordPass('TARIFS', 'création');
    } else {
      recordFail('TARIFS', 'création', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('TARIFS', 'création', err.message);
  }

  // 3.3 Modification de tarif
  try {
    const res = await fetch(`${BASE_URL}/api/prices/${targetCategoryId}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({
        id: createdPriceItemId,
        name: `Cartes Luxe Test Modifiées ${runId}`,
        unitPrice: 195,
        minQuantity: 300,
        active: true,
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data?.unitPrice === 195) {
      recordPass('TARIFS', 'modification');
    } else {
      recordFail('TARIFS', 'modification', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('TARIFS', 'modification', err.message);
  }

  // 3.4 Calcul de devis / grille tarifaire
  try {
    const res = await fetch(`${BASE_URL}/api/quotes/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({
        typePrestation: 'Cartes de visite',
        quantite: 500,
        format: 'Standard 85x55mm',
        supportPapier: '350g',
        impressionType: 'Recto/Verso',
        finition: 'Pelliculage Mat',
        delai: 'Standard',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data?.estimatedTotal > 0 && data.data?.unitPrice > 0) {
      recordPass('TARIFS', 'calcul', { total: data.data.estimatedTotal, unitPrice: data.data.unitPrice });
    } else {
      recordFail('TARIFS', 'calcul', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('TARIFS', 'calcul', err.message);
  }

  // 3.5 Calcul de devis avec quantité invalide / négative (BUG-007 Validation)
  try {
    const res = await fetch(`${BASE_URL}/api/quotes/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({
        typePrestation: 'Cartes de visite',
        quantite: -50,
      }),
    });
    const data = await res.json();
    if (res.status === 400 && !data.success) {
      recordPass('TARIFS', 'validation quantite invalide', { error: data.error });
    } else {
      recordFail('TARIFS', 'validation quantite invalide', `Attendu 400, reçu status ${res.status}`);
    }
  } catch (err: any) {
    recordFail('TARIFS', 'validation quantite invalide', err.message);
  }

  // --------------------------------------------------------------------------
  // 4. PORTFOLIO TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 4. TESTS PORTFOLIO');

  // 4.1 Affichage public
  try {
    const res = await fetch(`${BASE_URL}/api/portfolio`, {
      headers: { 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
      recordPass('PORTFOLIO', 'affichage public');
    } else {
      recordFail('PORTFOLIO', 'affichage public', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('PORTFOLIO', 'affichage public', err.message);
  }

  // 4.2 Image portfolio (upload image endpoint)
  let uploadedPortfolioImageUrl = '';
  try {
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = await createMultipartFormData({}, [
      {
        fieldName: 'image',
        fileName: `test-portfolio-${runId}.png`,
        content: dummyPngBuffer,
        contentType: 'image/png',
      },
    ]);

    const res = await fetch(`${BASE_URL}/api/portfolio/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}`, 'x-forwarded-for': getTestIp() },
      body: formData,
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.imageUrl) {
      uploadedPortfolioImageUrl = data.imageUrl;
      recordPass('PORTFOLIO', 'image', { url: data.imageUrl });
    } else {
      recordFail('PORTFOLIO', 'image', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('PORTFOLIO', 'image', err.message);
  }

  // 4.3 Ajout de réalisation
  try {
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = await createMultipartFormData(
      {
        title: `Projet Test Audit ${runId}`,
        category: 'Offset',
        description: 'Réalisation test créée pour valider le module portfolio.',
        client: 'Client Test S.A.',
        year: '2026',
        tags: 'Offset, Brochure, Test',
        featured: 'true',
        active: 'true',
        image: uploadedPortfolioImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      },
      [
        {
          fieldName: 'image',
          fileName: `portfolio-item-${runId}.png`,
          content: dummyPngBuffer,
          contentType: 'image/png',
        },
      ]
    );

    const res = await fetch(`${BASE_URL}/api/portfolio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}`, 'x-forwarded-for': getTestIp() },
      body: formData,
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.id) {
      createdPortfolioId = data.data.id;
      recordPass('PORTFOLIO', 'ajout');
    } else {
      recordFail('PORTFOLIO', 'ajout', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('PORTFOLIO', 'ajout', err.message);
  }

  // 4.4 Modification de réalisation
  try {
    const res = await fetch(`${BASE_URL}/api/portfolio/${createdPortfolioId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({
        title: `Projet Test Audit Mis à Jour ${runId}`,
        client: 'Client Test Renommé S.A.',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data?.title?.includes('Mis à Jour')) {
      recordPass('PORTFOLIO', 'modification');
    } else {
      recordFail('PORTFOLIO', 'modification', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('PORTFOLIO', 'modification', err.message);
  }

  // 4.5 Suppression de réalisation
  try {
    const res = await fetch(`${BASE_URL}/api/portfolio/${createdPortfolioId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}`, 'x-forwarded-for': getTestIp() },
    });
    const data = await res.json();
    if (res.status === 200 && data.success) {
      recordPass('PORTFOLIO', 'suppression');
    } else {
      recordFail('PORTFOLIO', 'suppression', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('PORTFOLIO', 'suppression', err.message);
  }

  // --------------------------------------------------------------------------
  // 5. DEVIS TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 5. TESTS DEVIS');

  // 5.1 Validation
  try {
    const res = await fetch(`${BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({
        nomComplet: '',
        telephone: 'not_a_phone',
        quantite: 0,
      }),
    });
    const data = await res.json();
    if (res.status === 400 && !data.success) {
      recordPass('DEVIS', 'validation');
    } else {
      recordFail('DEVIS', 'validation', `Attendu 400, reçu ${res.status}`);
    }
  } catch (err: any) {
    recordFail('DEVIS', 'validation', err.message);
  }

  // 5.2 Création + Référence + Calcul + Fichier
  try {
    const dummyPdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
    const formData = await createMultipartFormData(
      {
        nom: 'Kouchou',
        prenom: 'Michel',
        nomComplet: 'Michel Kouchou',
        entreprise: 'Société Agricole du Nord',
        telephone: '+237696311198',
        email: 'client.test@barkasolutions.org',
        ville: 'Ngaoundéré',
        typePrestation: 'Impression de Dépliants 3 Volets',
        produit: 'Dépliant A4 3 Volets 135g',
        quantite: '1000',
        format: 'A4 ouvert (29.7x21 cm)',
        supportPapier: 'Papier Couché 135g Satiné',
        impressionType: 'Recto/Verso',
        finition: 'Pliage 2 plis roulés',
        delai: 'Standard (3-5 jours)',
        livraisonOption: 'Retrait en agence',
        graphismeOption: 'Fichier prêt fourni',
        description: 'Test devis complet avec pièce jointe PDF pour audit.',
      },
      [
        {
          fieldName: 'files',
          fileName: 'maquette_depliant.pdf',
          content: dummyPdf,
          contentType: 'application/pdf',
        },
      ]
    );

    const res = await fetch(`${BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: { 'x-forwarded-for': getTestIp() },
      body: formData,
    });
    const data = await res.json();

    if (res.status === 201 && data.success && data.data?.id) {
      createdQuoteId = data.data.id;
      const q = data.data;

      // Référence test
      const refRegex = /^BKS-\d{4}-\d{5}$/;
      if (refRegex.test(q.id)) {
        recordPass('DEVIS', 'référence', { reference: q.id });
      } else {
        recordFail('DEVIS', 'référence', `Format invalide : ${q.id}`);
      }

      // Calcul test
      if (q.estimatedPrice && q.estimatedPrice > 0) {
        recordPass('DEVIS', 'calcul', { price: q.estimatedPrice });
      } else {
        recordFail('DEVIS', 'calcul', 'Prix estimé manquant');
      }

      // Fichier test
      if (q.files && q.files.length > 0 && q.files[0].originalName === 'maquette_depliant.pdf') {
        createdQuoteFileId = q.files[0].storedName || q.files[0].id;
        recordPass('DEVIS', 'fichier', { file: q.files[0] });
      } else {
        recordFail('DEVIS', 'fichier', 'Fichier non enregistré');
      }

      recordPass('DEVIS', 'création');
    } else {
      recordFail('DEVIS', 'création', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('DEVIS', 'création', err.message);
  }

  // 5.3 Statut
  try {
    const res = await fetch(`${BASE_URL}/api/quotes/${createdQuoteId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({
        status: 'EN_PRODUCTION',
        adminNotes: 'Fichiers BAT vérifiés par le responsable pré-presse.',
        finalPrice: 85000,
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data?.status === 'EN_PRODUCTION') {
      recordPass('DEVIS', 'statut');
    } else {
      recordFail('DEVIS', 'statut', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('DEVIS', 'statut', err.message);
  }

  // 5.4 Machine à états - Transition invalide rejetée (BUG-010 Validation)
  try {
    // 1. Passage à TERMINE
    await fetch(`${BASE_URL}/api/quotes/${createdQuoteId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({ status: 'TERMINE' }),
    });

    // 2. Tentative de transition interdite TERMINE -> DEVIS_ENVOYE par un EDITOR
    const invalidTransRes = await fetch(`${BASE_URL}/api/quotes/${createdQuoteId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': getTestIp(),
      },
      body: JSON.stringify({ status: 'DEVIS_ENVOYE' }),
    });
    const invalidData = await invalidTransRes.json();

    if (invalidTransRes.status === 409 && !invalidData.success) {
      recordPass('DEVIS', 'transition statut invalide rejetee', { code: invalidData.code });
    } else {
      recordFail(
        'DEVIS',
        'transition statut invalide rejetee',
        `Attendu 409, reçu ${invalidTransRes.status}`
      );
    }
  } catch (err: any) {
    recordFail('DEVIS', 'transition statut invalide rejetee', err.message);
  }

  // --------------------------------------------------------------------------
  // 6. EMAIL TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 6. TESTS EMAIL');

  // 6.1 Succès
  try {
    const { testEmailDelivery } = await import('../server/services/mailer.js');
    const emailResult = await testEmailDelivery('direction@barkasolutions.org');
    if (emailResult.sent === true || (emailResult.sent === false && typeof emailResult.error === 'string')) {
      recordPass('EMAIL', 'succès', { provider: emailResult.provider, sent: emailResult.sent });
    } else {
      recordFail('EMAIL', 'succès', 'Résultat d’envoi d’email inattendu');
    }
  } catch (err: any) {
    recordFail('EMAIL', 'succès', err.message);
  }

  // 6.2 Erreur
  try {
    const { sendEmail } = await import('../server/services/mailer.js');
    const invalidEmailRes = await sendEmail({
      to: 'invalid-email-address',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    if (invalidEmailRes.success === false && invalidEmailRes.sent === false && invalidEmailRes.error) {
      recordPass('EMAIL', 'erreur', { handledError: invalidEmailRes.error });
    } else {
      recordFail('EMAIL', 'erreur', 'L’adresse invalide n’a pas été rejetée');
    }
  } catch (err: any) {
    recordFail('EMAIL', 'erreur', err.message);
  }

  // --------------------------------------------------------------------------
  // 7. CONTACT TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 7. TESTS CONTACT');

  // 7.1 Validation
  try {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({
        name: 'A',
        emailOrPhone: 'invalid_data',
        message: 'hi',
      }),
    });
    const data = await res.json();
    if (res.status === 400 && !data.success) {
      recordPass('CONTACT', 'validation');
    } else {
      recordFail('CONTACT', 'validation', `Attendu 400, reçu ${res.status}`);
    }
  } catch (err: any) {
    recordFail('CONTACT', 'validation', err.message);
  }

  // 7.2 Anti-spam
  try {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getTestIp() },
      body: JSON.stringify({
        name: 'Bot Spammer',
        emailOrPhone: 'bot@spam.com',
        message: 'This is a spam message attempting to bypass filters.',
        website_url: 'http://spam-domain-trap.com',
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.code === 'BOT_HONEYPOT_TRIGGERED') {
      recordPass('CONTACT', 'anti-spam');
    } else {
      recordFail('CONTACT', 'anti-spam', `Attendu 400 BOT_HONEYPOT_TRIGGERED, reçu ${res.status}`);
    }
  } catch (err: any) {
    recordFail('CONTACT', 'anti-spam', err.message);
  }

  // --------------------------------------------------------------------------
  // 8. UPLOAD TESTS
  // --------------------------------------------------------------------------
  console.log('\n🔹 8. TESTS UPLOAD');

  // 8.1 Fichier autorisé
  try {
    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const formData = await createMultipartFormData(
      {
        nomComplet: 'Client Upload Test',
        telephone: '+237696311198',
        typePrestation: 'Impression Affiches',
        quantite: '50',
      },
      [
        {
          fieldName: 'files',
          fileName: 'affiche_test.png',
          content: dummyPng,
          contentType: 'image/png',
        },
      ]
    );

    const res = await fetch(`${BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: { 'x-forwarded-for': getTestIp() },
      body: formData,
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.files?.length > 0) {
      recordPass('UPLOAD', 'fichier autorisé');
    } else {
      recordFail('UPLOAD', 'fichier autorisé', `Status ${res.status}: ${data.error}`);
    }
  } catch (err: any) {
    recordFail('UPLOAD', 'fichier autorisé', err.message);
  }

  // 8.2 Fichier interdit
  try {
    const dummyScript = Buffer.from('#!/bin/bash\necho "exploit"', 'utf-8');
    const formData = await createMultipartFormData(
      {
        nomComplet: 'Attacker Test',
        telephone: '+237696311198',
        typePrestation: 'Impression',
        quantite: '10',
      },
      [
        {
          fieldName: 'files',
          fileName: 'malicious_script.sh',
          content: dummyScript,
          contentType: 'application/x-sh',
        },
      ]
    );

    const res = await fetch(`${BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: { 'x-forwarded-for': getTestIp() },
      body: formData,
    });
    const data = await res.json();
    if (res.status === 400 || res.status === 500) {
      recordPass('UPLOAD', 'fichier interdit', { status: res.status, error: data.error });
    } else {
      recordFail('UPLOAD', 'fichier interdit', `Le script .sh aurait dû être refusé (reçu status ${res.status})`);
    }
  } catch (err: any) {
    recordFail('UPLOAD', 'fichier interdit', err.message);
  }

  // 8.3 Fichier trop volumineux
  try {
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
    const formData = await createMultipartFormData({}, [
      {
        fieldName: 'image',
        fileName: 'huge_portfolio_image.jpg',
        content: bigBuffer,
        contentType: 'image/jpeg',
      },
    ]);

    const res = await fetch(`${BASE_URL}/api/portfolio/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}`, 'x-forwarded-for': getTestIp() },
      body: formData,
    });
    const data = await res.json();
    if (res.status === 400 || res.status === 413 || res.status === 500) {
      recordPass('UPLOAD', 'fichier trop volumineux');
    } else {
      recordFail('UPLOAD', 'fichier trop volumineux', `Le fichier de 11Mo aurait dû être refusé (reçu ${res.status})`);
    }
  } catch (err: any) {
    recordFail('UPLOAD', 'fichier trop volumineux', err.message);
  }

  // 8.4 Accès privé
  try {
    const directRes = await fetch(`${BASE_URL}/uploads/quotes/somefile.pdf`, {
      headers: { 'x-forwarded-for': getTestIp() },
    });
    const unauthDownloadRes = await fetch(
      `${BASE_URL}/api/quotes/${createdQuoteId}/files/${createdQuoteFileId || 'test.pdf'}`,
      { headers: { 'x-forwarded-for': getTestIp() } }
    );

    if (directRes.status === 403 && unauthDownloadRes.status === 401) {
      recordPass('UPLOAD', 'accès privé');
    } else {
      recordFail('UPLOAD', 'accès privé', `Attendu 403 & 401, reçu direct=${directRes.status}, unauth=${unauthDownloadRes.status}`);
    }
  } catch (err: any) {
    recordFail('UPLOAD', 'accès privé', err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 RAPPORT GLOBAL DE L’AUDIT DE TESTS');
  console.log('===============================================================');

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`\nTotal des tests exécutés : ${results.length}`);
  console.log(`✅ Réussis : ${passed.length}`);
  console.log(`❌ Échoués : ${failed.length}\n`);

  if (failed.length > 0) {
    console.log('Détail des échecs :');
    for (const f of failed) {
      console.log(`- [${f.category}] ${f.name}: ${f.error}`);
    }
  }

  return { total: results.length, passed: passed.length, failed: failed.length, failures: failed };
}

runAllTests().catch((err) => {
  console.error('Erreur fatale lors de l’audit de tests:', err);
  process.exit(1);
});
