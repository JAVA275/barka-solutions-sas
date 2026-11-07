import { Request, Response, NextFunction } from 'express';
import { deleteMulterFiles } from '../services/fileManager';

// Regular expressions for Cameroon and international phone formats
const PHONE_REGEX = /^(?:\+237|237)?[2368]\d{8}$|^(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function sanitizeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[<>]/g, '') // strip basic html tags
    .trim();
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.-]/g, '');
  return cleaned.length >= 8 && PHONE_REGEX.test(phone.trim());
}

/**
 * Middleware: Validate Quote creation inputs strictly on the server
 */
export function validateQuoteInput(req: Request, res: Response, next: NextFunction): void {
  const fail = (status: number, message: string, field?: string) => {
    // Nettoyer immédiatement tout fichier physique temporaire en cas de rejet de validation
    if (req.files) {
      deleteMulterFiles(req.files as Express.Multer.File[]);
    }
    res.status(status).json({
      success: false,
      error: message,
      ...(field ? { field } : {}),
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
    delai,
  } = req.body;

  // 1. Nom / Nom complet
  const rawNom = sanitizeString(nom);
  const rawPrenom = sanitizeString(prenom);
  const finalNomComplet = sanitizeString(nomComplet) || `${rawPrenom} ${rawNom}`.trim() || rawNom;

  if (!finalNomComplet || finalNomComplet.length < 2) {
    fail(400, 'Veuillez renseigner votre nom complet (au moins 2 caractères).', 'nom');
    return;
  }
  if (finalNomComplet.length > 100) {
    fail(400, 'Le nom renseigné est trop long (maximum 100 caractères).', 'nom');
    return;
  }

  // 2. Téléphone
  const rawPhone = sanitizeString(telephone);
  if (!rawPhone) {
    fail(400, 'Le numéro de téléphone est obligatoire.', 'telephone');
    return;
  }
  if (!isValidPhone(rawPhone)) {
    fail(400, 'Veuillez saisir un numéro de téléphone valide (ex: +237 696 31 11 98).', 'telephone');
    return;
  }

  // 3. Email (optionnel mais strictement validé si fourni)
  const rawEmail = sanitizeString(email);
  if (rawEmail) {
    if (!isValidEmail(rawEmail)) {
      fail(400, 'L’adresse e-mail renseignée est invalide.', 'email');
      return;
    }
    if (rawEmail.length > 120) {
      fail(400, 'L’adresse e-mail est trop longue (maximum 120 caractères).', 'email');
      return;
    }
  }

  // 4. Service / Type de prestation
  const rawPrestation = sanitizeString(typePrestation || service);
  if (!rawPrestation || rawPrestation.length < 2) {
    fail(400, 'Veuillez sélectionner un service ou type de prestation.', 'typePrestation');
    return;
  }
  if (rawPrestation.length > 150) {
    fail(400, 'Le type de prestation est trop long.', 'typePrestation');
    return;
  }

  // 5. Quantité
  if (quantite === undefined || quantite === null || String(quantite).trim() === '') {
    fail(400, 'La quantité demandée est obligatoire et doit être supérieure ou égale à 1.', 'quantite');
    return;
  }
  const qty = Number(quantite);
  if (isNaN(qty) || !Number.isInteger(qty) || qty < 1 || qty > 10_000_000) {
    fail(400, 'La quantité demandée doit être un nombre entier positif supérieur à 0 (max 10 000 000).', 'quantite');
    return;
  }

  // 6. Format
  const rawFormat = sanitizeString(format);
  if (rawFormat.length > 100) {
    fail(400, 'Le format renseigné est trop long (maximum 100 caractères).', 'format');
    return;
  }

  // 7. Finition
  const rawFinition = sanitizeString(finition);
  if (rawFinition.length > 150) {
    fail(400, 'La finition renseignée est trop longue (maximum 150 caractères).', 'finition');
    return;
  }

  // 8. Description
  const rawDescription = sanitizeString(description);
  if (rawDescription.length > 2000) {
    fail(400, 'La description ne doit pas dépasser 2000 caractères.', 'description');
    return;
  }

  // 9. Délai
  const rawDelai = sanitizeString(delai);
  if (rawDelai.length > 100) {
    fail(400, 'Le délai renseigné est trop long (maximum 100 caractères).', 'delai');
    return;
  }

  // 10. Fichiers
  if (req.files && Array.isArray(req.files)) {
    if (req.files.length > 5) {
      fail(400, 'Vous ne pouvez pas joindre plus de 5 fichiers.', 'files');
      return;
    }
    for (const file of req.files) {
      if (file.size > 50 * 1024 * 1024) {
        fail(400, `Le fichier "${file.originalname}" dépasse la taille maximale autorisée de 50 Mo.`, 'files');
        return;
      }
    }
  }

  next();
}

/**
 * Middleware: Validate Contact Message inputs
 */
export function validateContactInput(req: Request, res: Response, next: NextFunction): void {
  const { name, emailOrPhone, message } = req.body;

  const rawName = sanitizeString(name);
  const rawContact = sanitizeString(emailOrPhone);
  const rawMessage = sanitizeString(message);

  if (!rawName || rawName.length < 2) {
    res.status(400).json({
      success: false,
      error: 'Veuillez renseigner votre nom (au moins 2 caractères).',
    });
    return;
  }

  if (!rawContact) {
    res.status(400).json({
      success: false,
      error: 'Veuillez renseigner un numéro de téléphone ou une adresse e-mail de contact.',
    });
    return;
  }

  if (!isValidPhone(rawContact) && !isValidEmail(rawContact)) {
    res.status(400).json({
      success: false,
      error: 'Veuillez saisir un numéro de téléphone ou un e-mail valide pour être recontacté.',
    });
    return;
  }

  if (!rawMessage || rawMessage.length < 5) {
    res.status(400).json({
      success: false,
      error: 'Veuillez rédiger un message de description d’au moins 5 caractères.',
    });
    return;
  }

  next();
}

/**
 * Middleware: Validate Login inputs
 */
export function validateLoginInput(req: Request, res: Response, next: NextFunction): void {
  const { username, password } = req.body;

  const rawUser = sanitizeString(username);
  const rawPass = typeof password === 'string' ? password : '';

  if (!rawUser || !rawPass) {
    res.status(400).json({
      success: false,
      error: 'Identifiant et mot de passe obligatoires.',
    });
    return;
  }

  next();
}

/**
 * Middleware: Validate Pricing Calculator input (BUG-007 fix)
 */
export function validatePricingInput(req: Request, res: Response, next: NextFunction): void {
  const { quantite, typePrestation } = req.body;

  if (quantite !== undefined && quantite !== null && String(quantite).trim() !== '') {
    const qty = Number(quantite);
    if (!Number.isFinite(qty) || isNaN(qty) || !Number.isInteger(qty) || qty < 1 || qty > 10_000_000) {
      res.status(400).json({
        success: false,
        error: 'La quantité demandée doit être un nombre entier positif supérieur à 0 (max 10 000 000).',
        field: 'quantite',
      });
      return;
    }
  }

  if (typePrestation !== undefined && typePrestation !== null) {
    const rawPrestation = sanitizeString(typePrestation);
    if (rawPrestation.length > 150) {
      res.status(400).json({
        success: false,
        error: 'Le type de prestation est trop long (max 150 caractères).',
        field: 'typePrestation',
      });
      return;
    }
  }

  next();
}

