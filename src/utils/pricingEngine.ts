import { PriceCategory, PricePricingType, QuoteFormData } from '../types';

export interface PricingResult {
  estimatedTotal: number;
  unitPrice: number;
  priceType: PricePricingType;
  breakdown: {
    baseUnitPrice: number;
    volumeDiscountPercent: number;
    urgencyFee: number;
    deliveryFee: number;
    graphicDesignFee: number;
  };
  legalNotice: string;
  confirmationNotice: string;
}

export const LEGAL_NOTICE = 'ESTIMATION INDICATIVE';
export const CONFIRMATION_NOTICE = 'Le prix définitif sera confirmé après vérification du fichier et des spécifications techniques.';

export function calculateClientQuotePrice(
  formData: Partial<QuoteFormData>,
  priceCategories?: PriceCategory[]
): PricingResult {
  const qty = Math.max(1, Number(formData.quantite) || 1);
  const prestation = (formData.typePrestation || '').toLowerCase();
  const format = (formData.format || '').toLowerCase();
  const finition = (formData.finition || '').toLowerCase();
  const delai = (formData.delai || '').toLowerCase();
  const livraison = (formData.livraisonOption || '').toLowerCase();
  const graphisme = (formData.graphismeOption || '').toLowerCase();
  const impressionType = formData.impressionType || 'Recto seul';
  const paper = (formData.supportPapier || '').toLowerCase();
  const grammage = (formData.grammage || '').toLowerCase();

  let baseUnitPrice = 250;
  let priceType: PricePricingType = 'STARTING_AT';

  // Dynamic price lookup from price categories
  let foundInCategories = false;
  if (priceCategories && Array.isArray(priceCategories)) {
    for (const cat of priceCategories) {
      for (const item of cat.items || []) {
        if (item.active !== false) {
          const itemName = (item.name || '').toLowerCase();
          if (prestation && (prestation.includes(itemName) || itemName.includes(prestation))) {
            if (typeof item.unitPrice === 'number' && item.unitPrice > 0) {
              baseUnitPrice = item.unitPrice;
              priceType = 'FIXED';
              foundInCategories = true;
              break;
            }
          }
        }
      }
      if (foundInCategories) break;
    }
  }

  // Base pricing mapping fallback
  if (!foundInCategories) {
    if (prestation.includes('carte') || prestation.includes('visite')) {
      baseUnitPrice = 150;
      priceType = 'FIXED';
    } else if (prestation.includes('flyer') || prestation.includes('tract')) {
      baseUnitPrice = 90;
      priceType = 'FIXED';
    } else if (prestation.includes('depliant') || prestation.includes('plaquette')) {
      baseUnitPrice = 350;
      priceType = 'STARTING_AT';
    } else if (prestation.includes('carnet') || prestation.includes('facturier') || prestation.includes('autocopiant')) {
      baseUnitPrice = 2500;
      priceType = 'FIXED';
    } else if (prestation.includes('affiche')) {
      baseUnitPrice = 800;
      priceType = 'STARTING_AT';
    } else if (prestation.includes('bache') || prestation.includes('banderole')) {
      baseUnitPrice = 4500;
      priceType = 'STARTING_AT';
    } else if (prestation.includes('enseigne') || prestation.includes('lumineuse') || prestation.includes('3d')) {
      baseUnitPrice = 150000;
      priceType = 'CUSTOM_QUOTE';
    } else if (prestation.includes('roll-up') || prestation.includes('rollup') || prestation.includes('kakemono')) {
      baseUnitPrice = 35000;
      priceType = 'FIXED';
    } else if (prestation.includes('tampon') || prestation.includes('trodat')) {
      baseUnitPrice = 12500;
      priceType = 'FIXED';
    } else if (prestation.includes('mug') || prestation.includes('tasse')) {
      baseUnitPrice = 3500;
      priceType = 'FIXED';
    } else if (prestation.includes('t-shirt') || prestation.includes('polo') || prestation.includes('textile')) {
      baseUnitPrice = 6000;
      priceType = 'STARTING_AT';
    } else if (prestation.includes('casquette')) {
      baseUnitPrice = 3000;
      priceType = 'FIXED';
    } else if (prestation.includes('cle-usb') || prestation.includes('gadget')) {
      baseUnitPrice = 4500;
      priceType = 'STARTING_AT';
    } else if (prestation.includes('badge') || prestation.includes('pvc')) {
      baseUnitPrice = 1500;
      priceType = 'FIXED';
    } else if (prestation.includes('calendrier')) {
      baseUnitPrice = 1800;
      priceType = 'STARTING_AT';
    } else if (prestation.includes('habillage') || prestation.includes('vehicule')) {
      baseUnitPrice = 90000;
      priceType = 'CUSTOM_QUOTE';
    } else if (prestation.includes('logo') || prestation.includes('graphique')) {
      baseUnitPrice = 45000;
      priceType = 'FIXED';
    }
  }

  // Volume discount curve
  let volumeDiscount = 0;
  if (qty >= 5000) volumeDiscount = 0.35;
  else if (qty >= 2000) volumeDiscount = 0.25;
  else if (qty >= 1000) volumeDiscount = 0.20;
  else if (qty >= 500) volumeDiscount = 0.15;
  else if (qty >= 250) volumeDiscount = 0.10;
  else if (qty >= 100) volumeDiscount = 0.05;

  // Format multiplier
  let formatMultiplier = 1.0;
  if (format.includes('a3')) formatMultiplier = 1.8;
  else if (format.includes('a2')) formatMultiplier = 3.2;
  else if (format.includes('a1')) formatMultiplier = 5.0;
  else if (format.includes('a0')) formatMultiplier = 8.0;
  else if (format.includes('sur-mesure') || format.includes('grand')) formatMultiplier = 1.5;

  // Paper / Substrate multiplier
  let paperMultiplier = 1.0;
  if (paper.includes('350g') || grammage.includes('350')) paperMultiplier = 1.3;
  else if (paper.includes('300g') || grammage.includes('300')) paperMultiplier = 1.2;
  else if (paper.includes('tripli')) paperMultiplier = 1.4;
  else if (paper.includes('quadrupli')) paperMultiplier = 1.8;
  else if (paper.includes('satin') || paper.includes('brillant')) paperMultiplier = 1.1;

  // Impression Recto/Verso multiplier
  let impressionMultiplier = 1.0;
  if (impressionType === 'Recto/Verso') {
    impressionMultiplier = 1.5;
  }

  // Finishing extras
  let finishingExtra = 0;
  if (finition.includes('dorure') || finition.includes('or')) {
    finishingExtra += qty * 40;
  }
  if (finition.includes('pelliculage') || finition.includes('vernis')) {
    finishingExtra += qty * 25;
  }
  if (finition.includes('perforation') || finition.includes('numerote')) {
    finishingExtra += qty * 15;
  }
  if (finition.includes('oeillet') || finition.includes('ourlet')) {
    finishingExtra += 2500;
  }

  // Urgency multiplier
  let urgencyMultiplier = 0;
  if (delai.includes('express') || delai.includes('24-48h') || delai.includes('urgence')) {
    urgencyMultiplier = 0.20;
  } else if (delai.includes('super') || delai.includes('12h') || delai.includes('jour même')) {
    urgencyMultiplier = 0.40;
  }

  // Delivery fee
  let deliveryFee = 0;
  if (livraison.includes('ngaoundéré') && !livraison.includes('retrait')) {
    deliveryFee = 2000;
  } else if (livraison.includes('expédition') || livraison.includes('inter-villes')) {
    deliveryFee = 5000;
  }

  // Graphic design fee
  let graphicDesignFee = 0;
  if (graphisme.includes('création') || graphisme.includes('barka') || graphisme.includes('10 000')) {
    graphicDesignFee = 10000;
  }

  const effectiveUnitPrice = baseUnitPrice * formatMultiplier * paperMultiplier * impressionMultiplier * (1 - volumeDiscount);
  const productionSubtotal = effectiveUnitPrice * qty + finishingExtra;
  const urgencyFee = productionSubtotal * urgencyMultiplier;
  const totalRaw = productionSubtotal + urgencyFee + deliveryFee + graphicDesignFee;

  const finalEstimatedTotal = Math.max(1000, Math.ceil(totalRaw / 500) * 500);

  return {
    estimatedTotal: finalEstimatedTotal,
    unitPrice: Math.round(finalEstimatedTotal / qty),
    priceType,
    breakdown: {
      baseUnitPrice,
      volumeDiscountPercent: Math.round(volumeDiscount * 100),
      urgencyFee: Math.round(urgencyFee),
      deliveryFee,
      graphicDesignFee,
    },
    legalNotice: LEGAL_NOTICE,
    confirmationNotice: CONFIRMATION_NOTICE,
  };
}
