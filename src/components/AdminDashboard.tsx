import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Save,
  Check,
  Building,
  Phone,
  Mail,
  MapPin,
  Paperclip,
  Image,
  Sparkles,
  Search,
  Upload,
  Edit2,
  Tag,
  ChevronRight,
  UserCheck,
  CheckCircle,
  HelpCircle,
  X,
  Layers,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  AuthUser,
  SubmittedQuote,
  ContactMessage,
  ServerStats,
  CompanySettings,
  PortfolioItem,
  PortfolioCategory,
  QuoteStatus,
  ServiceItem,
  PriceCategory,
  PriceGridItem,
} from '../types';
import { apiService } from '../services/api';
import { COMPANY_SETTINGS } from '../config/companySettings';
import { OFFICIAL_QUOTE_STATUSES, QUOTE_STATUS_CONFIG, getQuoteStatusInfo } from '../utils/quoteStatus';
import { SERVICES_DATA, PRICE_GRID_CATEGORIES } from '../data/mockData';
import { AdminStatsTab } from './admin/AdminStatsTab';
import { AdminServicesTab } from './admin/AdminServicesTab';
import { AdminTarifsTab } from './admin/AdminTarifsTab';
import { AdminAuditTab } from './admin/AdminAuditTab';

interface AdminDashboardProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onBackToSite: () => void;
  initialTab?: AdminTab;
}

export type AdminTab = 'stats' | 'quotes' | 'services' | 'tarifs' | 'portfolio' | 'messages' | 'settings' | 'users' | 'audit';

const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  'Imprimerie',
  'Offset',
  'Numérique',
  'Sérigraphie',
  'Grand format',
  'Branding',
  'Signalétique',
  'Conception graphique',
  'Communication',
  'Autres',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  onBackToSite,
  initialTab = 'stats',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: AdminTab, statusFilter?: string) => {
    setActiveTab(tab);
    if (statusFilter) {
      setFilterQuoteStatus(statusFilter);
    }
    switch (tab) {
      case 'stats':
        navigate('/admin/dashboard');
        break;
      case 'quotes':
        navigate('/admin/devis');
        break;
      case 'services':
        navigate('/admin/services');
        break;
      case 'tarifs':
        navigate('/admin/tarifs');
        break;
      case 'portfolio':
        navigate('/admin/portfolio');
        break;
      case 'settings':
        navigate('/admin/parametres');
        break;
      case 'messages':
        navigate('/admin/messages');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'audit':
        navigate('/admin/audit');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };
  const [quotes, setQuotes] = useState<SubmittedQuote[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({ ...COMPANY_SETTINGS });
  const [usersList, setUsersList] = useState<AuthUser[]>([]);

  // Services & Tarifs Management State
  const [services, setServices] = useState<ServiceItem[]>(SERVICES_DATA);
  const [priceCategories, setPriceCategories] = useState<PriceCategory[]>(PRICE_GRID_CATEGORIES);

  // Quote Filters & Detail Selection
  const [filterQuoteStatus, setFilterQuoteStatus] = useState<string>('Tous');
  const [selectedQuote, setSelectedQuote] = useState<SubmittedQuote | null>(null);
  const [quoteAdminNotes, setQuoteAdminNotes] = useState<string>('');
  const [quoteFinalPrice, setQuoteFinalPrice] = useState<string>('');

  // Portfolio Filters & Modal
  const [portfolioFilterCategory, setPortfolioFilterCategory] = useState<string>('Tous');
  const [portfolioSearch, setPortfolioSearch] = useState<string>('');
  const [showPortfolioModal, setShowPortfolioModal] = useState<boolean>(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Portfolio Form State
  const [portfolioForm, setPortfolioForm] = useState<{
    title: string;
    category: PortfolioCategory;
    description: string;
    image: string;
    client: string;
    year: string;
    tags: string;
    serviceAssocie: string;
    featured: boolean;
    active: boolean;
    isDemo: boolean;
  }>({
    title: '',
    category: 'Imprimerie',
    description: '',
    image: '',
    client: '',
    year: new Date().getFullYear().toString(),
    tags: '',
    serviceAssocie: '',
    featured: false,
    active: true,
    isDemo: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const handleDownloadQuoteFile = async (quoteId: string, fileId: string, originalName: string) => {
    try {
      setDownloadingFileId(fileId);
      await apiService.downloadQuoteFile(quoteId, fileId, originalName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      alert(msg);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // New user form modal/state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'EDITOR' as 'ADMIN' | 'EDITOR',
  });

  const isAdmin = currentUser.role === 'ADMIN';

  // Mailer gateway state
  const [mailerStatus, setMailerStatus] = useState<{
    provider: string;
    isConfigured: boolean;
    fromEmail: string;
    fromName: string;
    adminEmails: string[];
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpSecure?: boolean;
    smtpUser?: string | null;
    hasSmtpPass?: boolean;
    hasApiKey?: boolean;
  } | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailFeedback, setTestEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load dashboard data directly from API
  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [quotesRes, portfolioRes, messagesRes, statsRes, companyRes, servicesRes, pricesRes] = await Promise.all([
        apiService.getQuotes(),
        apiService.getPortfolio(undefined, true),
        apiService.getContactMessages(),
        apiService.getStats(),
        apiService.getCompanyInfo(),
        apiService.getServices(true),
        apiService.getPriceCategories(),
      ]);

      if (quotesRes.success && Array.isArray(quotesRes.data)) {
        let allQuotes = [...quotesRes.data];
        try {
          const localStored = localStorage.getItem('barka_client_submitted_quotes');
          if (localStored) {
            const clientQuotes = JSON.parse(localStored);
            if (Array.isArray(clientQuotes)) {
              const serverIds = new Set(allQuotes.map((q) => q.id));
              for (const cq of clientQuotes) {
                if (cq && cq.id && !serverIds.has(cq.id)) {
                  allQuotes.push(cq);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Erreur lecture localStorage commandes clients:', e);
        }
        allQuotes.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setQuotes(allQuotes);
        if (allQuotes.length > 0 && !selectedQuote) {
          setSelectedQuote(allQuotes[0]);
          setQuoteAdminNotes(allQuotes[0].adminNotes || '');
          setQuoteFinalPrice(allQuotes[0].finalPrice?.toString() || '');
        }
      }

      if (portfolioRes.success && Array.isArray(portfolioRes.data)) {
        setPortfolio(portfolioRes.data);
      }

      if (messagesRes.success && Array.isArray(messagesRes.data)) {
        setMessages(messagesRes.data);
        if (messagesRes.data.length > 0 && !selectedMessage) {
          setSelectedMessage(messagesRes.data[0]);
        }
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (companyRes.success && companyRes.data) {
        setCompanySettings(companyRes.data);
      }

      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }

      if (pricesRes.success && Array.isArray(pricesRes.data)) {
        setPriceCategories(pricesRes.data);
      }

      // Check if critical items failed
      const errors = [quotesRes, portfolioRes, messagesRes, servicesRes, pricesRes]
        .filter((r) => !r.success && r.error)
        .map((r) => r.error);

      if (errors.length > 0 && !quotesRes.success && !portfolioRes.success) {
        setLoadError(errors[0] || 'Erreur lors du chargement des données depuis le serveur.');
      }

      if (isAdmin) {
        const [usersRes, mailerRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getMailerStatus(),
        ]);
        if (usersRes.success && usersRes.data) {
          setUsersList(usersRes.data);
        }
        if (mailerRes.success && mailerRes.data) {
          setMailerStatus(mailerRes.data);
        }
      }
    } catch (err: unknown) {
      console.error('Error loading admin data from API:', err);
      const msg = err instanceof Error ? err.message : 'Erreur de connexion aux serveurs de l’API';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected quote notes when quote selection changes
  useEffect(() => {
    if (selectedQuote) {
      setQuoteAdminNotes(selectedQuote.adminNotes || '');
      setQuoteFinalPrice(selectedQuote.finalPrice?.toString() || '');
    }
  }, [selectedQuote?.id]);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingEmail(true);
    setTestEmailFeedback(null);
    try {
      const res = await apiService.sendTestEmail(testEmailTarget.trim() || undefined);
      if (res.success) {
        setTestEmailFeedback({
          success: true,
          message: res.message || 'Email de test transmis avec succès !',
        });
      } else {
        setTestEmailFeedback({
          success: false,
          message: res.error || 'Échec de transmission de l’email de test',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur technique';
      setTestEmailFeedback({ success: false, message: msg });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // ================= QUOTE ACTIONS =================
  const handleUpdateQuoteStatus = async (
    status: QuoteStatus,
    adminNotes?: string,
    finalPrice?: number
  ) => {
    if (!selectedQuote) return;
    const res = await apiService.updateQuoteStatus(
      selectedQuote.id,
      status,
      adminNotes !== undefined ? adminNotes : quoteAdminNotes,
      finalPrice !== undefined ? finalPrice : (quoteFinalPrice ? Number(quoteFinalPrice) : undefined)
    );
    if (res.success && res.data) {
      setSelectedQuote(res.data);
      setQuotes((prev) => prev.map((q) => (q.id === res.data!.id ? res.data! : q)));
    } else {
      alert(res.error || 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleSaveQuoteAdminData = async () => {
    if (!selectedQuote) return;
    const res = await apiService.updateQuoteStatus(
      selectedQuote.id,
      selectedQuote.status,
      quoteAdminNotes,
      quoteFinalPrice ? Number(quoteFinalPrice) : undefined
    );
    if (res.success && res.data) {
      setSelectedQuote(res.data);
      setQuotes((prev) => prev.map((q) => (q.id === res.data!.id ? res.data! : q)));
      setSaveMessage('Détails administratifs de la commande sauvegardés.');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      alert(res.error || 'Erreur lors de la sauvegarde de la commande.');
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm(`Confirmer la suppression définitive de la commande ${id} ?`)) return;
    const res = await apiService.deleteQuote(id);
    if (res.success) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuote?.id === id) {
        setSelectedQuote(quotes.find((q) => q.id !== id) || null);
      }
      setSaveMessage('Commande supprimée avec succès.');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      alert(res.error || 'Erreur lors de la suppression de la commande.');
    }
  };

  // ================= QUOTE EXPORT ACTIONS =================
  const handleExportQuotesCSV = () => {
    if (quotes.length === 0) {
      alert('Aucune commande à exporter');
      return;
    }
    const headers = [
      'ID',
      'Date',
      'Nom',
      'Entreprise',
      'Telephone',
      'Ville',
      'Prestation',
      'Quantite',
      'Format',
      'Prix Estime (FCFA)',
      'Prix Valide (FCFA)',
      'Statut',
      'Notes Atelier',
    ];
    const rows = quotes.map((q) => [
      `"${q.id}"`,
      `"${new Date(q.submittedAt).toLocaleDateString('fr-FR')}"`,
      `"${q.nom || q.nomComplet || ''}"`,
      `"${q.entreprise || ''}"`,
      `"${q.telephone || ''}"`,
      `"${q.ville || ''}"`,
      `"${q.typePrestation || ''}"`,
      `"${q.quantite || ''}"`,
      `"${q.format || ''}"`,
      `"${q.estimatedPrice || ''}"`,
      `"${q.finalPrice || ''}"`,
      `"${q.status || ''}"`,
      `"${(q.adminNotes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commandes-barka-solutions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportQuotesJSON = () => {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commandes-barka-solutions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // ================= SERVICES ACTIONS =================
  const handleSaveService = async (serviceToSave: ServiceItem) => {
    try {
      const exists = services.some((s) => s.id === serviceToSave.id);
      if (exists) {
        const res = await apiService.updateService(serviceToSave.id, serviceToSave);
        if (res.success && res.data) {
          setServices((prev) => prev.map((s) => (s.id === serviceToSave.id ? res.data! : s)));
          setSaveMessage('Service mis à jour avec succès sur le serveur.');
        } else {
          setSaveMessage(res.error || 'Erreur lors de la mise à jour du service sur le serveur.');
        }
      } else {
        const res = await apiService.createService(serviceToSave);
        if (res.success && res.data) {
          setServices((prev) => [res.data!, ...prev]);
          setSaveMessage('Nouveau service créé avec succès sur le serveur.');
        } else {
          setSaveMessage(res.error || 'Erreur lors de la création du service sur le serveur.');
        }
      }
    } catch (err) {
      console.error('Erreur enregistrement service:', err);
      setSaveMessage('Erreur réseau ou serveur lors de la sauvegarde du service.');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await apiService.deleteService(id);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        setSaveMessage('Service supprimé avec succès du serveur.');
      } else {
        alert(res.error || 'Erreur lors de la suppression du service.');
      }
    } catch (err) {
      console.error('Erreur suppression service:', err);
      setSaveMessage('Erreur lors de la suppression du service.');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleToggleActiveService = async (id: string, active: boolean) => {
    try {
      // Optimistic UI update
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
      await apiService.updateService(id, { active });
    } catch (err) {
      console.error('Erreur mise à jour statut service:', err);
    }
  };

  // ================= TARIFS ACTIONS =================
  const handleSaveCategoryItem = async (categoryId: string, itemToSave: PriceGridItem) => {
    try {
      // Optimistic update
      setPriceCategories((prev) => {
        return prev.map((cat) => {
          if (cat.id !== categoryId) return cat;
          const itemExists = (cat.items || []).some((i) => i.id === itemToSave.id);
          const newItems = itemExists
            ? cat.items.map((i) => (i.id === itemToSave.id ? itemToSave : i))
            : [itemToSave, ...(cat.items || [])];
          return { ...cat, items: newItems };
        });
      });

      const res = await apiService.savePriceItem(categoryId, itemToSave);
      if (res.success) {
        setSaveMessage('Grille tarifaire mise à jour sur le serveur.');
        const fresh = await apiService.getPriceCategories();
        if (fresh.success && fresh.data) setPriceCategories(fresh.data);
      } else {
        setSaveMessage(res.error || 'Erreur lors de la sauvegarde du tarif.');
      }
    } catch (e) {
      console.error('API error saving price item:', e);
      setSaveMessage('Erreur lors de la sauvegarde du tarif.');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDeleteCategoryItem = async (categoryId: string, itemId: string) => {
    try {
      const res = await apiService.deletePriceItem(categoryId, itemId);
      if (res.success) {
        setPriceCategories((prev) => {
          return prev.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return { ...cat, items: (cat.items || []).filter((i) => i.id !== itemId) };
          });
        });
        setSaveMessage('Ligne tarifaire supprimée du serveur.');
        const fresh = await apiService.getPriceCategories();
        if (fresh.success && fresh.data) setPriceCategories(fresh.data);
      } else {
        alert(res.error || 'Erreur lors de la suppression de la ligne tarifaire.');
      }
    } catch (e) {
      console.error('API error deleting price item:', e);
      setSaveMessage('Erreur lors de la suppression du tarif.');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleToggleActiveCategoryItem = async (categoryId: string, itemId: string, active: boolean) => {
    try {
      // Optimistic update
      setPriceCategories((prev) => {
        return prev.map((cat) => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            items: (cat.items || []).map((i) => (i.id === itemId ? { ...i, active } : i)),
          };
        });
      });

      await apiService.togglePriceItem(categoryId, itemId);
      const fresh = await apiService.getPriceCategories();
      if (fresh.success && fresh.data) setPriceCategories(fresh.data);
    } catch (e) {
      console.error('API error toggling price item:', e);
    }
  };

  // ================= PORTFOLIO ACTIONS =================
  const handleOpenAddPortfolio = () => {
    setEditingPortfolioItem(null);
    setPortfolioForm({
      title: '',
      category: 'Imprimerie',
      description: '',
      image: '',
      client: '',
      year: new Date().getFullYear().toString(),
      tags: '',
      serviceAssocie: '',
      featured: false,
      active: true,
      isDemo: false,
    });
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setPortfolioForm({
      title: item.title,
      category: item.category,
      description: item.description || '',
      image: item.image,
      client: item.client || '',
      year: item.year || new Date().getFullYear().toString(),
      tags: item.tags ? item.tags.join(', ') : '',
      serviceAssocie: item.serviceAssocie || '',
      featured: Boolean(item.featured),
      active: item.active !== false,
      isDemo: Boolean(item.isDemo),
    });
    setShowPortfolioModal(true);
  };

  const handleTogglePortfolioActive = async (item: PortfolioItem) => {
    try {
      const res = await apiService.togglePortfolioActive(item.id);
      if (res.success && res.data) {
        setPortfolio((prev) => prev.map((p) => (p.id === item.id ? { ...p, active: res.data!.active } : p)));
      } else {
        // Fallback local toggle & refresh
        setPortfolio((prev) => prev.map((p) => (p.id === item.id ? { ...p, active: !p.active } : p)));
        const fresh = await apiService.getPortfolio(undefined, true);
        if (fresh) setPortfolio(fresh);
      }
    } catch (err) {
      console.error('Error toggling portfolio item active state:', err);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingImage(true);
    // Direct device photo loading & canvas compression (instant preview & storage)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPortfolioForm((prev) => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.85) }));
        } else {
          setPortfolioForm((prev) => ({ ...prev, image: ev.target?.result as string }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);

    try {
      const res = await apiService.uploadPortfolioImage(file);
      if (res.success && res.imageUrl) {
        setPortfolioForm((prev) => ({ ...prev, image: res.imageUrl! }));
      }
    } catch {
      // Retain Base64 Data URL if server upload cannot write to disk
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSavePortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioForm.title || !portfolioForm.image) {
      alert('Veuillez renseigner un titre et une image.');
      return;
    }

    const tagsArray = portfolioForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingPortfolioItem) {
      // Update existing item
      const res = await apiService.updatePortfolioItem(editingPortfolioItem.id, {
        title: portfolioForm.title,
        category: portfolioForm.category,
        description: portfolioForm.description,
        image: portfolioForm.image,
        client: portfolioForm.client,
        year: portfolioForm.year,
        tags: tagsArray,
        serviceAssocie: portfolioForm.serviceAssocie,
        featured: portfolioForm.featured,
        active: portfolioForm.active,
        isDemo: portfolioForm.isDemo,
      });

      if (res.success && res.data) {
        setPortfolio((prev) => prev.map((p) => (p.id === res.data!.id ? res.data! : p)));
        setShowPortfolioModal(false);
      } else {
        alert(res.error || 'Erreur de mise à jour');
      }
    } else {
      // Create new item
      const formData = new FormData();
      formData.append('title', portfolioForm.title);
      formData.append('category', portfolioForm.category);
      formData.append('description', portfolioForm.description);
      formData.append('imageUrl', portfolioForm.image);
      formData.append('client', portfolioForm.client);
      formData.append('year', portfolioForm.year);
      formData.append('tags', portfolioForm.tags);
      formData.append('serviceAssocie', portfolioForm.serviceAssocie);
      formData.append('featured', String(portfolioForm.featured));
      formData.append('active', String(portfolioForm.active));
      formData.append('isDemo', String(portfolioForm.isDemo));

      const res = await apiService.createPortfolioItem(formData);
      if (res.success && res.data) {
        setPortfolio((prev) => [res.data!, ...prev]);
        setShowPortfolioModal(false);
      } else {
        alert(res.error || 'Erreur de création');
      }
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    if (!confirm('Confirmer la suppression de cette réalisation du portfolio ?')) return;
    const res = await apiService.deletePortfolioItem(id);
    if (res.success) {
      setPortfolio((prev) => prev.filter((p) => p.id !== id));
      setSaveMessage('Réalisation supprimée avec succès.');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      alert(res.error || 'Erreur lors de la suppression de la réalisation.');
    }
  };

  // ================= MESSAGES & SETTINGS =================
  const handleToggleMessageRead = async (id: string, currentRead: boolean) => {
    const res = await apiService.updateMessageStatus(id, !currentRead);
    if (res.success && res.data) {
      setMessages((prev) => prev.map((m) => (m.id === id ? res.data! : m)));
      if (selectedMessage?.id === id) {
        setSelectedMessage(res.data);
      }
    } else {
      alert(res.error || 'Erreur lors de la mise à jour du message.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Confirmer la suppression de ce message ?')) return;
    const res = await apiService.deleteContactMessage(id);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(messages.find((m) => m.id !== id) || null);
      }
      setSaveMessage('Message supprimé avec succès.');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      alert(res.error || 'Erreur lors de la suppression du message.');
    }
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const res = await apiService.updateCompanyInfo(companySettings);
    if (res.success && res.data) {
      setCompanySettings(res.data);
      setSaveMessage('Paramètres de l’entreprise sauvegardés avec succès.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const res = await apiService.createUser(newUserForm);
    if (res.success && res.data) {
      setUsersList((prev) => [...prev, res.data as AuthUser]);
      setShowAddUser(false);
      setNewUserForm({ username: '', email: '', fullName: '', password: '', role: 'EDITOR' });
    } else {
      alert(res.error || 'Erreur lors de la création de l’utilisateur');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Confirmer la suppression de cet utilisateur ?')) return;
    const res = await apiService.deleteUser(id);
    if (res.success) {
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    } else {
      alert(res.error || 'Erreur suppression');
    }
  };

  // Filtered lists
  const filteredQuotes = filterQuoteStatus === 'Tous'
    ? quotes
    : quotes.filter((q) => q.status === filterQuoteStatus || getQuoteStatusInfo(q.status).key === filterQuoteStatus);

  const filteredPortfolio = portfolio.filter((item) => {
    const matchesCat = portfolioFilterCategory === 'Tous' || item.category === portfolioFilterCategory;
    const matchesSearch = !portfolioSearch.trim() ||
      item.title.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
      (item.client && item.client.toLowerCase().includes(portfolioSearch.toLowerCase())) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(portfolioSearch.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSite}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Retour au site public"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Site public</span>
            </button>

            <div className="h-6 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-amber-400 font-black text-xs shadow-inner">
                BS
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight">{COMPANY_SETTINGS.company_name}</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Espace d'Administration Sécurisé</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User badge */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center text-xs font-bold">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-200 leading-tight">{currentUser.fullName}</p>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                    isAdmin ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/20 text-blue-300'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 border-t border-slate-800/60 pt-1 scrollbar-none">
          <button
            onClick={() => handleTabChange('stats')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stats'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            DASHBOARD
          </button>

          <button
            onClick={() => handleTabChange('quotes')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'quotes'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            COMMANDES ({quotes.length})
            {quotes.filter((q) => q.status === 'NOUVEAU' || q.status === 'Nouveau').length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {quotes.filter((q) => q.status === 'NOUVEAU' || q.status === 'Nouveau').length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('services')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'services'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            SERVICES ({services.length})
          </button>

          <button
            onClick={() => handleTabChange('tarifs')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tarifs'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            TARIFS
          </button>

          <button
            onClick={() => handleTabChange('portfolio')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'portfolio'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            PORTFOLIO ({portfolio.length})
          </button>

          <button
            onClick={() => handleTabChange('messages')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'messages'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            MESSAGES
            {messages.filter((m) => !m.read).length > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {messages.filter((m) => !m.read).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            PARAMÈTRES
          </button>

          {isAdmin && (
            <button
              onClick={() => handleTabChange('users')}
              className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'users'
                  ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              UTILISATEURS
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleTabChange('audit')}
              className={`px-3.5 py-2.5 text-xs font-black tracking-wide rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-white text-blue-950 border-t-2 border-blue-900 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              AUDIT (LOGS)
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {loadError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-extrabold">Erreur de chargement des données API</div>
                <div className="text-[11px] font-normal text-rose-700">{loadError}</div>
              </div>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer shrink-0 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réessayer
            </button>
          </div>
        )}

        {saveMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {saveMessage}
          </div>
        )}

        {/* ================= TAB: QUOTES (Étape 8 - 9 Statuts complets) ================= */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            {/* Filter pills & Export Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
                <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
                <button
                  onClick={() => setFilterQuoteStatus('Tous')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    filterQuoteStatus === 'Tous'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tous ({quotes.length})
                </button>
                {OFFICIAL_QUOTE_STATUSES.map((statusKey) => {
                  const statusInfo = getQuoteStatusInfo(statusKey);
                  const count = quotes.filter((q) => q.status === statusKey || getQuoteStatusInfo(q.status).key === statusKey).length;
                  return (
                    <button
                      key={statusKey}
                      onClick={() => setFilterQuoteStatus(statusKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        filterQuoteStatus === statusKey
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                      <span>{statusInfo.label}</span>
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  onClick={handleExportQuotesCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                  title="Exporter toutes les commandes au format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-900" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportQuotesJSON}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                  title="Exporter les commandes au format JSON"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Split view: List & Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Quotes list */}
              <div className="lg:col-span-5 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                {filteredQuotes.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                    Aucune commande trouvée dans ce statut.
                  </div>
                ) : (
                  filteredQuotes.map((q) => {
                    const statusInfo = getQuoteStatusInfo(q.status);
                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuote(q)}
                        className={`p-4 rounded-2xl border transition cursor-pointer ${
                          selectedQuote?.id === q.id
                            ? 'bg-blue-50/80 border-blue-900 shadow-md ring-1 ring-blue-900'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-extrabold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                            {q.id}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                            {statusInfo.label}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 truncate">{q.nomComplet}</h4>
                        <p className="text-xs text-slate-600 truncate">{q.typePrestation}</p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span>{q.quantite} ex.</span>
                          <strong className="text-slate-900 font-bold">
                            ~{(q.finalPrice || q.estimatedPrice || 0).toLocaleString('fr-FR')} FCFA
                          </strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quote details */}
              <div className="lg:col-span-7">
                {selectedQuote ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900">{selectedQuote.id}</h3>
                          <span className="text-xs text-slate-400">
                            {new Date(selectedQuote.submittedAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {selectedQuote.nomComplet} — {selectedQuote.entreprise || 'Particulier'}
                        </p>
                      </div>

                      {/* Status changer */}
                      <div className="flex items-center gap-2">
                        <select
                          value={getQuoteStatusInfo(selectedQuote.status).key}
                          onChange={(e) => handleUpdateQuoteStatus(e.target.value as QuoteStatus)}
                          className="px-3 py-2 rounded-xl border-2 border-blue-900 text-xs font-black bg-white text-blue-950 cursor-pointer shadow-xs"
                        >
                          {OFFICIAL_QUOTE_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {QUOTE_STATUS_CONFIG[st].stepNumber > 0 ? `${QUOTE_STATUS_CONFIG[st].stepNumber}. ` : ''}
                              {QUOTE_STATUS_CONFIG[st].label}
                            </option>
                          ))}
                        </select>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteQuote(selectedQuote.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Supprimer cette commande"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status Workflow Progress Visualizer */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${getQuoteStatusInfo(selectedQuote.status).dotColor}`} />
                          Statut Actuel : {getQuoteStatusInfo(selectedQuote.status).label}
                        </span>
                        <span className="text-[11px] text-slate-500 italic">
                          {getQuoteStatusInfo(selectedQuote.status).description}
                        </span>
                      </div>

                      {/* Status History Timeline */}
                      {selectedQuote.statusHistory && selectedQuote.statusHistory.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                            Historique des transitions :
                          </span>
                          <div className="space-y-1">
                            {selectedQuote.statusHistory.map((hist, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-100">
                                <span className="font-semibold text-slate-800">
                                  {getQuoteStatusInfo(hist.status).label}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {new Date(hist.timestamp).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Client info card */}
                    <div className="bg-slate-50 p-4 rounded-xl text-xs border border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-slate-500 block">Téléphone</span>
                          <strong className="text-slate-900">{selectedQuote.telephone}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">E-mail</span>
                          <strong className="text-slate-900 truncate block">{selectedQuote.email || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Ville</span>
                          <strong className="text-slate-900">{selectedQuote.ville}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Livraison</span>
                          <strong className="text-slate-900">{selectedQuote.livraisonOption || 'Retrait'}</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                        <a
                          href={`https://wa.me/${(selectedQuote.telephone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Bonjour ${selectedQuote.nom || ''}, l'équipe BARKA SOLUTIONS a bien pris en compte votre commande N° ${selectedQuote.id} pour ${selectedQuote.typePrestation}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Contacter sur WhatsApp
                        </a>

                        <a
                          href={`tel:${selectedQuote.telephone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-900" />
                          Appeler le client
                        </a>
                      </div>
                    </div>

                    {/* Technical details */}
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Spécifications techniques</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block">Prestation / Produit</span>
                          <strong className="text-slate-900 text-sm">{selectedQuote.typePrestation}</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block">Quantité commandée</span>
                          <strong className="text-blue-900 text-sm">{selectedQuote.quantite} exemplaires</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block">Format & Papier</span>
                          <strong className="text-slate-900">{selectedQuote.format} • {selectedQuote.supportPapier}</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block">Impression & Finition</span>
                          <strong className="text-slate-900">{selectedQuote.impressionType || 'Recto'} • {selectedQuote.finition}</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block">Délai souhaité</span>
                          <strong className="text-slate-900">{selectedQuote.delai}</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block">Préparation graphique</span>
                          <strong className="text-slate-900">{selectedQuote.graphismeOption || 'Fichier fourni'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Attached files */}
                    {selectedQuote.files && selectedQuote.files.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          Fichiers joints ({selectedQuote.files.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedQuote.files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs"
                            >
                              <div>
                                <strong className="text-slate-900 block">{file.originalName}</strong>
                                <span className="text-slate-500">{(file.fileSize / 1024).toFixed(0)} Ko • {file.mimeType}</span>
                              </div>
                              <button
                                type="button"
                                disabled={downloadingFileId === (file.id || file.storedName || file.filePath)}
                                onClick={() =>
                                  handleDownloadQuoteFile(
                                    selectedQuote.id,
                                    file.id || file.storedName || file.filePath,
                                    file.originalName
                                  )
                                }
                                className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                {downloadingFileId === (file.id || file.storedName || file.filePath)
                                  ? 'Téléchargement...'
                                  : 'Télécharger'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Notes and Final Price Input */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-700">Traitement Commercial & Notes Internes</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Prix final validé (FCFA)</label>
                          <input
                            type="number"
                            value={quoteFinalPrice}
                            onChange={(e) => setQuoteFinalPrice(e.target.value)}
                            placeholder={`Ex: ${selectedQuote.estimatedPrice || 0}`}
                            className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Notes internes & consignes atelier</label>
                          <input
                            type="text"
                            value={quoteAdminNotes}
                            onChange={(e) => setQuoteAdminNotes(e.target.value)}
                            placeholder="Ex: BAT validé par WhatsApp..."
                            className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleSaveQuoteAdminData}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Enregistrer les notes
                        </button>
                      </div>
                    </div>

                    {/* Pricing banner & WhatsApp reply */}
                    <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Estimation / Tarif</span>
                        <div className="text-2xl font-black text-amber-400">
                          {(selectedQuote.finalPrice || selectedQuote.estimatedPrice || 0).toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${(selectedQuote.telephone || '').replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(selectedQuote.nomComplet || selectedQuote.nom || '')}%2C%20BARKA%20SOLUTIONS%20concernant%20votre%20commande%20${selectedQuote.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Répondre au client sur WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                    Sélectionnez une commande dans la liste pour afficher ses détails.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: PORTFOLIO (Étape 9 - Portfolio Dynamique & Gestion des Réalisations) ================= */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Image className="w-5 h-5 text-blue-900" />
                  Gestion du Portfolio BARKA SOLUTIONS
                </h2>
                <p className="text-xs text-slate-500">
                  Remplacer les images génériques par les vraies réalisations de l’atelier.
                </p>
              </div>

              <button
                onClick={handleOpenAddPortfolio}
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Ajouter une réalisation
              </button>
            </div>

            {/* Filter and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    placeholder="Filtrer les réalisations..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setPortfolioFilterCategory('Tous')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                      portfolioFilterCategory === 'Tous'
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Toutes ({portfolio.length})
                  </button>
                  {PORTFOLIO_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPortfolioFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        portfolioFilterCategory === cat
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPortfolio.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border ${
                    item.active === false ? 'border-slate-300 opacity-70 bg-slate-50' : 'border-slate-200'
                  } overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between`}
                >
                  <div>
                    {/* Image Preview */}
                    <div className="relative aspect-16/10 bg-slate-900">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2.5 left-2.5 bg-blue-950/80 text-amber-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                        {item.category}
                      </div>
                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                        {item.featured && (
                          <div className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            À la une
                          </div>
                        )}
                        {item.isDemo && (
                          <div className="bg-slate-900/90 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-700">
                            Spécimen démo
                          </div>
                        )}
                        {item.active === false && (
                          <div className="bg-rose-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Masqué
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-semibold">
                          {item.client || (item.isDemo ? 'Spécimen atelier' : 'Client BARKA')}
                        </span>
                        <span className="text-slate-400 font-mono">{item.year || '2026'}</span>
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTogglePortfolioActive(item)}
                      className={`p-1.5 px-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                        item.active === false
                          ? 'bg-slate-200 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                      title={item.active === false ? 'Activer et rendre visible sur le site' : 'Désactiver / Masquer du site'}
                    >
                      {item.active === false ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inactif</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Actif</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPortfolio(item)}
                        className="p-1.5 px-2 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Modifier cette réalisation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeletePortfolioItem(item.id)}
                        className="p-1.5 px-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Supprimer du portfolio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPortfolio.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                Aucune réalisation trouvée. Cliquez sur "Ajouter une réalisation" pour en créer une.
              </div>
            )}

            {/* Modal: Add/Edit Portfolio Realization */}
            {showPortfolioModal && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-900" />
                      {editingPortfolioItem ? 'Modifier la réalisation' : 'Ajouter une réalisation au portfolio'}
                    </h3>
                    <button
                      onClick={() => setShowPortfolioModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePortfolioItem} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Titre de la réalisation *</label>
                      <input
                        type="text"
                        required
                        value={portfolioForm.title}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                        placeholder="Ex: Enseigne lumineuse LED Restaurant Le Relais"
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Catégorie *</label>
                        <select
                          value={portfolioForm.category}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value as PortfolioCategory })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold"
                        >
                          {PORTFOLIO_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Service Associé</label>
                        <input
                          type="text"
                          value={portfolioForm.serviceAssocie}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, serviceAssocie: e.target.value })}
                          placeholder="Ex: Offset grand tirage"
                          className="w-full p-2.5 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Photo de la réalisation depuis l'appareil */}
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-700 uppercase text-xs">Photo de la réalisation *</label>

                      {/* Image Preview */}
                      {portfolioForm.image ? (
                        <div className="relative aspect-16/9 bg-slate-900 rounded-lg overflow-hidden border border-slate-300 mb-2">
                          <img src={portfolioForm.image} alt="Aperçu" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPortfolioForm((prev) => ({ ...prev, image: '' }))}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer"
                            title="Supprimer la photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null}

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        {isUploadingImage
                          ? 'Chargement de la photo...'
                          : portfolioForm.image
                          ? 'Changer la photo depuis cet appareil'
                          : 'Charger une photo depuis cet appareil'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Nom du Client</label>
                        <input
                          type="text"
                          value={portfolioForm.client}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, client: e.target.value })}
                          placeholder="Ex: Société Agroalimentaire du Nord"
                          className="w-full p-2.5 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Année</label>
                        <input
                          type="text"
                          value={portfolioForm.year}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, year: e.target.value })}
                          placeholder="2026"
                          className="w-full p-2.5 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Tags (séparés par des virgules)</label>
                      <input
                        type="text"
                        value={portfolioForm.tags}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, tags: e.target.value })}
                        placeholder="Enseigne, LED, Plexiglas, Ngaoundéré"
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Description détaillée</label>
                      <textarea
                        rows={3}
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                        placeholder="Détails des finitions, grammages, matériaux..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl resize-none"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="active-check"
                          checked={portfolioForm.active}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, active: e.target.checked })}
                          className="w-4 h-4 text-blue-900 rounded cursor-pointer"
                        />
                        <label htmlFor="active-check" className="font-bold text-slate-700 cursor-pointer">
                          Visible sur le site public (Statut Actif)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="featured-check"
                          checked={portfolioForm.featured}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, featured: e.target.checked })}
                          className="w-4 h-4 text-blue-900 rounded cursor-pointer"
                        />
                        <label htmlFor="featured-check" className="font-bold text-slate-700 cursor-pointer">
                          Mettre en avant sur la page d'accueil (Badge "À la une")
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isdemo-check"
                          checked={portfolioForm.isDemo}
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, isDemo: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                        />
                        <label htmlFor="isdemo-check" className="font-bold text-slate-700 cursor-pointer">
                          Donnée de démonstration / Projet témoin (Spécimen d'atelier non contractuel)
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowPortfolioModal(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5 text-amber-400" />
                        {editingPortfolioItem ? 'Mettre à jour' : 'Ajouter au portfolio'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: MESSAGES ================= */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              {messages.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                  Aucun message de contact enregistré.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMessage(m)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      selectedMessage?.id === m.id
                        ? 'bg-blue-50/70 border-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-sm text-slate-900 font-bold">{m.name}</strong>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.read ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'}`}>
                        {m.read ? 'Lu' : 'Nouveau'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{m.subject || m.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(m.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-7">
              {selectedMessage ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedMessage.name}</h3>
                      <p className="text-xs text-slate-500">{selectedMessage.emailOrPhone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMessageRead(selectedMessage.id, selectedMessage.read)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {selectedMessage.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                  Sélectionnez un message pour le lire.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: STATS (Étape 17 Dashboard Analytics) ================= */}
        {activeTab === 'stats' && (
          <AdminStatsTab
            quotes={quotes}
            stats={stats}
            messages={messages}
            portfolio={portfolio}
            isLoading={isLoading}
            onNavigateTab={(tab, status) => handleTabChange(tab, status)}
            onExportQuotesCSV={handleExportQuotesCSV}
            onRetry={loadData}
          />
        )}

        {/* ================= TAB: SERVICES (Étape 18 Gestion Services) ================= */}
        {activeTab === 'services' && (
          <AdminServicesTab
            services={services}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            onToggleActiveService={handleToggleActiveService}
          />
        )}

        {/* ================= TAB: TARIFS (Étape 18 Gestion Grilles Tarifaires) ================= */}
        {activeTab === 'tarifs' && (
          <AdminTarifsTab
            categories={priceCategories}
            onSaveCategoryItem={handleSaveCategoryItem}
            onDeleteItem={handleDeleteCategoryItem}
            onToggleActiveItem={handleToggleActiveCategoryItem}
          />
        )}

        {/* ================= TAB: COMPANY SETTINGS ================= */}
        {activeTab === 'settings' && !isAdmin && (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xs text-center space-y-4 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-['Outfit']">Accès Réservé à l'Administrateur</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
                Votre compte dispose du rôle <strong>ÉDITEUR</strong>. Vous pouvez consulter et traiter les commandes, services, tarifs, portfolio et messages clients. La configuration globale de l'entreprise et du serveur est réservée aux <strong>ADMINISTRATEURS</strong>.
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={() => handleTabChange('stats')}
                className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Retourner au Tableau de Bord
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-4xl shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-900" />
                Source Unique de Vérité — Paramètres de BARKA SOLUTIONS
              </h2>
              <p className="text-xs text-slate-500">
                Ces informations se synchronisent automatiquement sur l’ensemble des pages du site.
              </p>
            </div>

            <form onSubmit={handleSaveCompanySettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom commercial</label>
                  <input
                    type="text"
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Raison sociale légale</label>
                  <input
                    type="text"
                    value={companySettings.legal_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, legal_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slogan officiel</label>
                  <input
                    type="text"
                    value={companySettings.slogan}
                    onChange={(e) => setCompanySettings({ ...companySettings, slogan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Numéro WhatsApp Officiel</label>
                  <input
                    type="text"
                    value={companySettings.whatsapp}
                    onChange={(e) => setCompanySettings({ ...companySettings, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Téléphone Principal</label>
                  <input
                    type="text"
                    value={companySettings.phone_primary}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone_primary: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Téléphone Secondaire</label>
                  <input
                    type="text"
                    value={companySettings.phone_secondary}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone_secondary: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={companySettings.email_primary}
                    onChange={(e) => setCompanySettings({ ...companySettings, email_primary: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail Secondaire</label>
                  <input
                    type="email"
                    value={companySettings.email_secondary}
                    onChange={(e) => setCompanySettings({ ...companySettings, email_secondary: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Adresse Géographique</label>
                  <input
                    type="text"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder les paramètres
                </button>
              </div>
            </form>

            {/* Email / SMTP Gateway Diagnostic Card */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-900" />
                    Passerelle Email & Notifications Automatiques
                  </h3>
                  <p className="text-xs text-slate-500">
                    Système d’envoi d'e-mails pour commandes et messages de contact (SMTP, Brevo, Resend, SendGrid, Mailgun).
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border">
                  {mailerStatus?.isConfigured ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Passerelle Active ({mailerStatus.provider.toUpperCase()})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Non configuré (.env requis)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-4">
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Fournisseur d'envoi</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {mailerStatus?.provider || 'Non configuré'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Expéditeur par défaut</span>
                  <span className="font-medium text-slate-800 truncate block" title={mailerStatus?.fromEmail}>
                    {mailerStatus?.fromName} &lt;{mailerStatus?.fromEmail}&gt;
                  </span>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <span className="text-slate-500 font-semibold block mb-0.5">Destinataires Admin</span>
                  <span className="font-medium text-blue-900 text-[11px] block">
                    {mailerStatus?.adminEmails?.join(', ') || 'direction@barkasolutions.org, kouchoumichel@yahoo.fr'}
                  </span>
                </div>
              </div>

              {/* Live email delivery test tool */}
              <form onSubmit={handleTestEmail} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Entrez un email pour tester la délivrabilité (ex: test@domaine.com)"
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTestingEmail}
                  className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isTestingEmail ? 'Test en cours...' : 'Tester l’envoi d’email'}
                </button>
              </form>

              {testEmailFeedback && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                    testEmailFeedback.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-red-50 text-red-900 border-red-200'
                  }`}
                >
                  {testEmailFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testEmailFeedback.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: USERS & ROLES (ADMIN ONLY) ================= */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gestion des Comptes d'Accès</h3>
                <p className="text-xs text-slate-500">Comptes autorisés avec rôles ADMIN ou EDITOR.</p>
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Ajouter un utilisateur
              </button>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rôle</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">
                        {u.fullName} <span className="text-slate-400 font-normal">(@{u.username})</span>
                      </td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            u.role === 'ADMIN' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Créer un nouvel utilisateur</h3>
                  <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Nom complet</label>
                      <input
                        type="text"
                        required
                        value={newUserForm.fullName}
                        onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Nom d'utilisateur</label>
                      <input
                        type="text"
                        required
                        value={newUserForm.username}
                        onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Mot de passe</label>
                      <input
                        type="password"
                        required
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Rôle</label>
                      <select
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="EDITOR">Éditeur (Gestion commandes, portfolio, contenu)</option>
                        <option value="ADMIN">Administrateur (Tous les droits)</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="px-4 py-2 border rounded-xl font-bold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-900 text-white rounded-xl font-bold cursor-pointer"
                      >
                        Créer le compte
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: AUDIT LOGS (ADMIN ONLY) ================= */}
        {activeTab === 'audit' && isAdmin && (
          <AdminAuditTab currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};
