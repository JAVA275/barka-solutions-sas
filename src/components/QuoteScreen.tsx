import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  UploadCloud,
  CheckCircle2,
  FileText,
  Calculator,
  MessageCircle,
  Clock,
  Sparkles,
  Paperclip,
  Trash2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  FileCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { QuoteFormData, SubmittedQuote, TabType, PriceCategory } from '../types';
import { COMPANY_SETTINGS } from '../config/companySettings';
import { calculateClientQuotePrice, LEGAL_NOTICE, CONFIRMATION_NOTICE } from '../utils/pricingEngine';
import { apiService } from '../services/api';

interface QuoteScreenProps {
  onBack: () => void;
  preselectedProduct?: string;
  onQuoteSubmitted?: (quote: SubmittedQuote) => void;
  onSelectTab: (tab: TabType) => void;
}

const PRESTATIONS_LIST = [
  { id: 'cartes-visite', label: 'Cartes de visite professionnelles', category: 'Imprimerie' },
  { id: 'flyers', label: 'Flyers & Tracts publicitaires', category: 'Imprimerie' },
  { id: 'depliants', label: 'Dépliants & Plaquettes (2/3 volets)', category: 'Imprimerie' },
  { id: 'facturiers', label: 'Facturiers & Carnets autocopiants', category: 'Papeterie' },
  { id: 'affiches', label: 'Affiches publicitaires (A3 / A2 / A1)', category: 'Imprimerie' },
  { id: 'baches', label: 'Bâches & Banderoles grand format', category: 'Grand format' },
  { id: 'roll-up', label: 'Roll-up & Kakémonos aluminium', category: 'Signalétique' },
  { id: 'enseigne', label: 'Enseigne lumineuse LED & 3D relief', category: 'Signalétique' },
  { id: 'tampons', label: 'Tampons encreurs professionnels Trodat', category: 'Bureautique' },
  { id: 'goodies', label: 'Mugs & Gourdes personnalisées', category: 'Goodies' },
  { id: 'textile', label: 'T-shirts, Polos & Casquettes brodés/sérigraphiés', category: 'Textile' },
  { id: 'badges', label: 'Badges PVC & Cartes magnétiques', category: 'Signalétique' },
  { id: 'calendriers', label: 'Calendriers muraux & sous-mains', category: 'Imprimerie' },
  { id: 'habillage', label: 'Habillage de véhicules & Vitrines', category: 'Grand format' },
  { id: 'conception', label: 'Conception graphique & Identité visuelle (PAO)', category: 'Design' },
];

const FORMATS_LIST = [
  { id: '85x55', label: '85 x 55 mm (Format carte standard)' },
  { id: 'A6', label: 'A6 (10.5 x 14.8 cm)' },
  { id: 'A5', label: 'A5 (14.8 x 21 cm)' },
  { id: 'A4', label: 'A4 (21 x 29.7 cm)' },
  { id: 'A3', label: 'A3 (29.7 x 42 cm)' },
  { id: 'A2', label: 'A2 (42 x 59.4 cm)' },
  { id: '85x200', label: 'Roll-up standard (85 x 200 cm)' },
  { id: 'sur-mesure', label: 'Format sur-mesure / Grand format' },
];

const PAPIERS_LIST = [
  { id: 'couche-350', label: 'Papier Couché 350g (Rigide / Premium)' },
  { id: 'couche-250', label: 'Papier Couché 250g (Semi-rigide)' },
  { id: 'couche-135', label: 'Papier Couché 135g (Flyers & Dépliants)' },
  { id: 'offset-80', label: 'Papier Offset 80g (En-têtes & Registres)' },
  { id: 'autocopiant-dupli', label: 'Autocopiant Dupli (50 feuillets x 2)' },
  { id: 'autocopiant-tripli', label: 'Autocopiant Tripli (50 feuillets x 3)' },
  { id: 'bache-510', label: 'Bâche PVC 510g Haute Résistance UV' },
  { id: 'vinyle-adhesif', label: 'Vinyle Adhésif Microperforé / Découpé' },
];

const FINITIONS_LIST = [
  { id: 'standard', label: 'Finition standard (Découpe droite)' },
  { id: 'pelliculage-mat', label: 'Pelliculage Mat élégant' },
  { id: 'pelliculage-brillant', label: 'Pelliculage Brillant haute brillance' },
  { id: 'vernis-uv', label: 'Vernis sélectif brillant UV' },
  { id: 'dorure', label: 'Dorure à chaud (Or / Argent)' },
  { id: 'numerotation', label: 'Numérotation séquentielle + Perforation' },
  { id: 'agrafes-reliure', label: 'Reliure piqûre 2 agrafes / Spirale' },
  { id: 'oeillets', label: 'Œillets métalliques renforcés + Ourlet' },
];

const DELAIS_LIST = [
  { id: 'standard', label: 'Standard (3 à 5 jours ouvrés)', extra: 'Inclus' },
  { id: 'express', label: 'Express (24h à 48h)', extra: '+20%' },
  { id: 'super-express', label: 'Super Express (12h - Jour même)', extra: '+40%' },
];

const LIVRAISONS_LIST = [
  { id: 'retrait', label: 'Retrait gratuit à l’agence (Derrière Resto Le Verger, Ngaoundéré)' },
  { id: 'ville', label: 'Livraison express à domicile / bureau Ngaoundéré' },
  { id: 'inter-villes', label: 'Expédition sécurisée Garoua / Maroua / Yaoundé / Douala' },
];

const GRAPHISME_OPTIONS = [
  { id: 'pret', label: 'J’ai déjà mon fichier prêt pour impression (PDF / PNG / AI HD)' },
  { id: 'creation', label: 'Création graphique & mise en page sur mesure par notre équipe' },
];

export const QuoteScreen: React.FC<QuoteScreenProps> = ({
  onBack,
  preselectedProduct,
  onQuoteSubmitted,
  onSelectTab,
}) => {
  // Current active step (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState<QuoteFormData>({
    nom: '',
    prenom: '',
    nomComplet: '',
    entreprise: '',
    telephone: '+237 ',
    email: '',
    ville: 'Ngaoundéré',
    typePrestation: preselectedProduct || 'Cartes de visite professionnelles',
    produit: '',
    quantite: 250,
    format: '85 x 55 mm (Format carte standard)',
    supportPapier: 'Papier Couché 350g (Rigide / Premium)',
    grammage: '350g/m²',
    impressionType: 'Recto/Verso',
    finition: 'Pelliculage Mat élégant',
    delai: 'Standard (3 à 5 jours ouvrés)',
    livraisonOption: 'Retrait gratuit à l’agence (Derrière Resto Le Verger, Ngaoundéré)',
    graphismeOption: 'J’ai déjà mon fichier prêt pour impression (PDF / PNG / AI HD)',
    description: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState('');
  const [formRenderedAt] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<SubmittedQuote | null>(null);
  const [submissionEmailStatus, setSubmissionEmailStatus] = useState<{
    sentToAdmin?: boolean;
    sentToClient?: boolean;
    error?: string;
  } | null>(null);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState<string>('');
  const [priceCategories, setPriceCategories] = useState<PriceCategory[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiService.getPriceCategories().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setPriceCategories(res.data);
      }
    }).catch((err) => console.error('Error fetching quote pricing categories:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Live real-time pricing calculation
  const pricingResult = useMemo(() => {
    return calculateClientQuotePrice(formData, priceCategories);
  }, [formData, priceCategories]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files) as File[];
      // Max 5 files, 50MB max each
      const validFiles = selected.filter((f: File) => f.size <= 50 * 1024 * 1024);
      if (validFiles.length < selected.length) {
        alert('Certains fichiers dépassent la taille maximale autorisée de 50 Mo.');
      }
      setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    const nomComplet = `${formData.prenom || ''} ${formData.nom || ''}`.trim() || formData.nomComplet;
    if (!formData.nom && !nomComplet) {
      setErrorMessage('Veuillez renseigner votre nom ou prénom.');
      return false;
    }
    if (!formData.telephone || formData.telephone.trim().length < 8) {
      setErrorMessage('Veuillez saisir un numéro de téléphone valide pour le suivi.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.typePrestation) {
      setErrorMessage('Veuillez sélectionner le type de prestation.');
      return false;
    }
    if (!formData.quantite || formData.quantite < 1) {
      setErrorMessage('La quantité doit être supérieure ou égale à 1.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setErrorMessage(null);
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const goToPreviousStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const nomComplet = `${formData.prenom || ''} ${formData.nom || ''}`.trim() || formData.nomComplet || formData.nom;

    const payload: QuoteFormData = {
      ...formData,
      nomComplet,
      estimatedPrice: pricingResult.estimatedTotal,
      priceType: pricingResult.priceType,
      barka_hp_check: honeypot,
      _form_rendered_at: formRenderedAt,
    };

    try {
      const res = await apiService.submitQuote(payload, uploadedFiles);

      if (res.success && res.data) {
        setSubmittedQuote(res.data);
        setSubmissionEmailStatus(
          res.emailStatus || {
            sentToAdmin: Boolean(res.sentToAdmin),
            sentToClient: Boolean(res.sentToClient),
          }
        );
        setWhatsappShareUrl(res.whatsappUrl || `https://wa.me/${COMPANY_SETTINGS.whatsapp_raw}`);
        setIsSuccess(true);
        if (onQuoteSubmitted) {
          onQuoteSubmitted(res.data);
        }

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0010c2', '#d97706', '#10b981'],
        });
      } else {
        setErrorMessage(res.error || 'Erreur lors de l’envoi de votre devis.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (isSuccess && submittedQuote) {
    return (
      <div id="quote-success-view" className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 md:p-12">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="inline-block bg-amber-50 text-amber-900 border border-amber-200 px-4 py-1.5 rounded-full font-bold text-sm mb-4">
            RÉFÉRENCE OFFICIELLE : {submittedQuote.id}
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Demande de devis enregistrée avec succès !
          </h2>

          <div className="text-slate-600 max-w-2xl mx-auto mb-8 text-base space-y-3">
            <p>
              Merci <strong>{submittedQuote.nomComplet}</strong>. Votre dossier a été transmis à l’équipe technique
              BARKA SOLUTIONS S.A.S pour traitement prioritaire.
            </p>
            {submissionEmailStatus?.sentToClient ? (
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Un e-mail de confirmation avec votre récapitulatif vous a été envoyé à <strong>{submittedQuote.email}</strong>.</span>
              </div>
            ) : submittedQuote.email ? (
              <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs">
                <span>Dossier enregistré sous la référence <strong>{submittedQuote.id}</strong>. Conservez ce numéro pour tout échange avec nos équipes.</span>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-left max-w-2xl mx-auto mb-8 space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Prestation</span>
              <span className="text-slate-900 font-bold">{submittedQuote.typePrestation}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Quantité</span>
              <span className="text-slate-900 font-bold">{submittedQuote.quantite} ex.</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Format & Support</span>
              <span className="text-slate-900 font-medium">{submittedQuote.format}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Finition</span>
              <span className="text-slate-900 font-medium">{submittedQuote.finition}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-700 font-semibold">Tarification</span>
              <span className="text-blue-900 font-extrabold text-base">
                Sur devis personnalisé (Réponse sous 24h)
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              id="quote-btn-whatsapp-open"
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              Ouvrir sur WhatsApp (+237 696 311 198)
            </motion.a>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="quote-btn-new"
              onClick={() => {
                setIsSuccess(false);
                setSubmittedQuote(null);
                setCurrentStep(1);
                setUploadedFiles([]);
              }}
              className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Nouvelle demande
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          id="quote-btn-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Système de Commande BARKA S.A.S
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Moteur de chiffrage direct & devis personnalisé
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Passer une Commande sur Mesure
        </h1>
        <p className="text-slate-600 text-base">
          Configurez votre projet en 4 étapes simples et obtenez une estimation immédiate avec validation technique.
        </p>
      </div>

      {/* 4 STEPS PROGRESS BAR */}
      <div className="mb-6 sm:mb-10">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-4 relative">
          {[
            { step: 1, label: 'Client', fullLabel: '1. Informations Client', icon: User },
            { step: 2, label: 'Projet', fullLabel: '2. Projet & Spécifications', icon: Layers },
            { step: 3, label: 'Fichiers', fullLabel: '3. Fichiers & PAO', icon: Paperclip },
            { step: 4, label: 'Récapitulatif', fullLabel: '4. Récapitulatif & Envoi', icon: FileCheck },
          ].map(({ step, label, fullLabel, icon: Icon }) => {
            const isDone = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <button
                key={step}
                id={`step-indicator-${step}`}
                onClick={() => {
                  if (step < currentStep) setCurrentStep(step);
                }}
                disabled={step > currentStep}
                className={`min-h-[48px] flex flex-col items-center text-center p-1.5 sm:p-3 rounded-xl border transition cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-white text-slate-400 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                    isCurrent
                      ? 'bg-white text-blue-900'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : step}
                </div>
                <span className="hidden md:inline font-bold text-xs">{fullLabel}</span>
                <span className="md:hidden font-bold text-[10px] sm:text-xs leading-tight truncate max-w-[65px]">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN STEP CONTENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 mb-8">
        {/* ================= STEP 1: CLIENT INFORMATIONS ================= */}
        {currentStep === 1 && (
          <div id="quote-step-1" className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-900" />
                Étape 1 — Coordonnées du demandeur
              </h2>
              <p className="text-sm text-slate-500">
                Vos coordonnées sont indispensables pour vous faire parvenir l'offre chiffrée et vous contacter.
              </p>
            </div>

            {/* Invisible Honeypot Anti-Bot Field */}
            <div
              style={{
                position: 'absolute',
                opacity: 0,
                zIndex: -1,
                pointerEvents: 'none',
                height: 0,
                width: 0,
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              <label htmlFor="barka_hp_quote_check">Ne pas remplir ce champ de validation</label>
              <input
                id="barka_hp_quote_check"
                type="text"
                name="barka_hp_check"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Nom <span className="text-rose-500">*</span>
                </label>
                <input
                  id="quote-input-nom"
                  type="text"
                  required
                  placeholder="ex: KOUCHOU"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Prénom
                </label>
                <input
                  id="quote-input-prenom"
                  type="text"
                  placeholder="ex: Michel"
                  value={formData.prenom || ''}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Entreprise / Organisation / Particulier
                </label>
                <div className="relative">
                  <Building className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="quote-input-entreprise"
                    type="text"
                    placeholder="ex: Pharmacie Centrale / Cabinet Alpha"
                    value={formData.entreprise || ''}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Téléphone (WhatsApp de préférence) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="quote-input-telephone"
                    type="tel"
                    required
                    placeholder="+237 696 311 198"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Adresse E-mail
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="quote-input-email"
                    type="email"
                    placeholder="contact@exemple.cm"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Ville de livraison / résidence <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    id="quote-select-ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white font-medium cursor-pointer"
                  >
                    <option value="Ngaoundéré">Ngaoundéré (Adamaoua)</option>
                    <option value="Garoua">Garoua (Nord)</option>
                    <option value="Maroua">Maroua (Extrême-Nord)</option>
                    <option value="Yaoundé">Yaoundé (Centre)</option>
                    <option value="Douala">Douala (Littoral)</option>
                    <option value="Autre ville">Autre ville / Région</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PROJECT SPECIFICATIONS ================= */}
        {currentStep === 2 && (
          <div id="quote-step-2" className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-900" />
                Étape 2 — Spécifications du projet & fabrication
              </h2>
              <p className="text-sm text-slate-500">
                Précisez vos options techniques pour un calcul d'estimation au plus juste.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Type de prestation */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Prestation / Type de produit <span className="text-rose-500">*</span>
                </label>
                <select
                  id="quote-select-prestation"
                  value={formData.typePrestation}
                  onChange={(e) => setFormData({ ...formData, typePrestation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 font-bold bg-white cursor-pointer"
                >
                  {PRESTATIONS_LIST.map((p) => (
                    <option key={p.id} value={p.label}>
                      [{p.category}] {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Quantité souhaitée <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="quote-input-quantite"
                    type="number"
                    min="1"
                    required
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 font-bold text-lg"
                  />
                  <div className="grid grid-cols-4 sm:flex gap-1.5">
                    {[100, 250, 500, 1000].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setFormData({ ...formData, quantite: qty })}
                        className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer flex items-center justify-center ${
                          formData.quantite === qty
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Format du support
                </label>
                <select
                  id="quote-select-format"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white cursor-pointer"
                >
                  {FORMATS_LIST.map((f) => (
                    <option key={f.id} value={f.label}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Support / Papier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Support / Type de papier
                </label>
                <select
                  id="quote-select-papier"
                  value={formData.supportPapier}
                  onChange={(e) => setFormData({ ...formData, supportPapier: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white cursor-pointer"
                >
                  {PAPIERS_LIST.map((pap) => (
                    <option key={pap.id} value={pap.label}>
                      {pap.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Impression Recto/Verso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Type d'impression
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Recto seul', 'Recto/Verso'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, impressionType: type as any })}
                      className={`p-3 rounded-xl border font-bold text-sm transition cursor-pointer ${
                        formData.impressionType === type
                          ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Finition & Façonnage
                </label>
                <select
                  id="quote-select-finition"
                  value={formData.finition}
                  onChange={(e) => setFormData({ ...formData, finition: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white cursor-pointer"
                >
                  {FINITIONS_LIST.map((fn) => (
                    <option key={fn.id} value={fn.label}>
                      {fn.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Délai */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Délai de fabrication
                </label>
                <select
                  id="quote-select-delai"
                  value={formData.delai}
                  onChange={(e) => setFormData({ ...formData, delai: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white cursor-pointer"
                >
                  {DELAIS_LIST.map((d) => (
                    <option key={d.id} value={d.label}>
                      {d.label} ({d.extra})
                    </option>
                  ))}
                </select>
              </div>

              {/* Graphisme Option */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Préparation graphique (PAO)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GRAPHISME_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, graphismeOption: g.label as any })}
                      className={`p-3.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        formData.graphismeOption === g.label
                          ? 'bg-blue-50 border-blue-900 text-blue-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Livraison */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Mode de livraison
                </label>
                <select
                  id="quote-select-livraison"
                  value={formData.livraisonOption}
                  onChange={(e) => setFormData({ ...formData, livraisonOption: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 bg-white cursor-pointer"
                >
                  {LIVRAISONS_LIST.map((l) => (
                    <option key={l.id} value={l.label}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Description détaillée ou contraintes particulières
                </label>
                <textarea
                  id="quote-input-description"
                  rows={3}
                  placeholder="Ex : numérotation rouge de 001 à 2500, logo spécifique en filigrane, pose requise le 15 du mois..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 text-sm"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: REAL FILE UPLOAD ================= */}
        {currentStep === 3 && (
          <div id="quote-step-3" className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-blue-900" />
                Étape 3 — Fichiers & Pièces jointes (Upload réel)
              </h2>
              <p className="text-sm text-slate-500">
                Transmettez vos maquettes, logos ou fichiers d'impression. Formats acceptés : PDF, JPG, PNG, SVG, AI, PSD, ZIP (jusqu'à 50 Mo par fichier).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl p-8 text-center bg-slate-50/50 transition">
              <UploadCloud className="w-12 h-12 text-blue-900 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Glissez-déposez vos fichiers ici ou parcourez
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                PDF vectoriel, AI, PSD, PNG 300 DPI, JPG Haute Définition ou archive ZIP.
              </p>

              <label
                htmlFor="file-upload-input"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl cursor-pointer shadow-sm transition"
              >
                <Paperclip className="w-4 h-4" />
                Parcourir mes documents
              </label>
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.svg,.ai,.psd,.zip,.eps,.cdr,.indd"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">
                  Fichiers prêts pour transmission ({uploadedFiles.length} / 5)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-6 h-6 text-blue-900 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} Mo • {file.type || 'Fichier'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Supprimer ce fichier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-3">
                <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-700" />
                <span>
                  Vous n’avez pas encore de fichier ? Vous pouvez continuer sans pièce jointe et envoyer vos éléments plus tard via WhatsApp ou confier la création à nos graphistes.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: RECAPITULATIVE & SUBMIT ================= */}
        {currentStep === 4 && (
          <div id="quote-step-4" className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-900" />
                Étape 4 — Récapitulatif du projet & Estimation
              </h2>
              <p className="text-sm text-slate-500">
                Vérifiez l’ensemble des informations avant validation et envoi officiel à nos ateliers.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left col: Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client recap */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">1. Client</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                    >
                      Modifier
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Nom & Prénom</span>
                      <strong className="text-slate-900 font-bold text-sm">
                        {formData.prenom} {formData.nom}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Entreprise</span>
                      <strong className="text-slate-900">{formData.entreprise || 'Particulier'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Téléphone</span>
                      <strong className="text-slate-900">{formData.telephone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ville & Email</span>
                      <strong className="text-slate-900">
                        {formData.ville} {formData.email ? `• ${formData.email}` : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Project recap */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">2. Spécifications</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                    >
                      Modifier
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Prestation</span>
                      <strong className="text-slate-900 font-bold text-sm">{formData.typePrestation}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Quantité</span>
                      <strong className="text-slate-900 font-extrabold text-blue-900 text-sm">
                        {formData.quantite} exemplaires
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Format</span>
                      <strong className="text-slate-900">{formData.format}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Support & Papier</span>
                      <strong className="text-slate-900">{formData.supportPapier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Impression & Finition</span>
                      <strong className="text-slate-900">
                        {formData.impressionType} • {formData.finition}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Délai souhaité</span>
                      <strong className="text-slate-900">{formData.delai}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Livraison</span>
                      <strong className="text-slate-900">{formData.livraisonOption}</strong>
                    </div>
                  </div>
                </div>

                {/* Files recap */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">3. Fichiers joints</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                    >
                      Gérer ({uploadedFiles.length})
                    </button>
                  </div>
                  {uploadedFiles.length > 0 ? (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {uploadedFiles.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{f.name}</span>
                          <span className="text-slate-400">({(f.size / 1024).toFixed(0)} Ko)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucun fichier joint pour le moment.</p>
                  )}
                </div>
              </div>

              {/* Right col: Price estimation card */}
              <div className="bg-gradient-to-b from-blue-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="inline-block bg-amber-500 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                    Devis gratuit & sans engagement
                  </div>

                  <span className="text-xs text-slate-300 block font-medium">Tarification globale</span>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-2">
                    Sur devis personnalisé
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 py-3 border-y border-white/10 my-4">
                    <div className="flex justify-between">
                      <span>Quantité sélectionnée :</span>
                      <strong className="text-white font-mono">{formData.quantite} ex</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Délai de livraison :</span>
                      <strong className="text-amber-400">{formData.delai}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Étude technique :</span>
                      <span className="text-emerald-400 font-bold">100% Gratuite</span>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3 text-[11px] leading-relaxed text-slate-300 border border-white/10">
                    ℹ️ <strong>Note importante :</strong> Nos techniciens examinent vos spécifications et vous transmettent votre chiffrage exact sous 24h par email et WhatsApp.
                  </div>
                </div>

                <div className="mt-6 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    id="quote-btn-submit"
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-4 rounded-xl font-extrabold text-base shadow-lg shadow-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Enregistrement en cours...</span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        VALIDER LA COMMANDE
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER WIZARD NAVIGATION */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
          className={`min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
            currentStep === 1
              ? 'hidden sm:inline-flex opacity-0 pointer-events-none'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Étape précédente
        </motion.button>

        {currentStep < 4 ? (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={goToNextStep}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-900/20 transition-colors cursor-pointer"
          >
            Étape suivante
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        ) : null}
      </div>
    </div>
  );
};
