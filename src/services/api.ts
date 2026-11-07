import {
  AuthResponse,
  AuthUser,
  CompanySettings,
  ContactMessage,
  PortfolioItem,
  QuoteFormData,
  ServerStats,
  SubmittedQuote,
  ServiceItem,
  PriceCategory,
  PriceGridItem,
  AuditLog,
  AuditFilterOptions,
} from '../types';

const TOKEN_KEY = 'barka_auth_token';

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  [key: string]: any;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function getAuthHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Robust, safe, unified client-side fetch wrapper that guarantees
 * structured responses and prevents silent error swallowing.
 */
async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, options);

    // Try parsing json body
    let json: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        json = await res.json();
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        clearStoredToken();
        return {
          success: false,
          error: json?.error || 'Session expirée ou non autorisée. Veuillez vous reconnecter.',
        };
      }
      if (res.status === 403) {
        return {
          success: false,
          error: json?.error || 'Accès refusé. Privilèges insuffisants pour effectuer cette action.',
        };
      }
      if (res.status === 404) {
        return {
          success: false,
          error: json?.error || 'Ressource demandée introuvable sur le serveur.',
        };
      }
      if (res.status >= 500) {
        return {
          success: false,
          error: json?.error || 'Le serveur a rencontré une erreur. Veuillez réessayer ultérieurement.',
        };
      }

      return {
        success: false,
        error: json?.error || `Erreur de requête (Code HTTP ${res.status}).`,
      };
    }

    if (json && typeof json === 'object') {
      if (json.success === false) {
        return {
          success: false,
          error: json.error || 'Une erreur est survenue.',
        };
      }
      return {
        success: true,
        data: json.data !== undefined ? json.data : (json as unknown as T),
        count: json.count,
        ...json,
      };
    }

    return {
      success: true,
      data: json as T,
    };
  } catch (err: unknown) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, err);
    return {
      success: false,
      error: 'Impossible de joindre le serveur. Veuillez vérifier votre connexion ou réessayer plus tard.',
    };
  }
}

export const apiService = {
  // ================= AUTH =================
  async login(username: string, password: string): Promise<AuthResponse> {
    const result = await apiRequest<AuthUser>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.token) {
      setStoredToken(result.token);
    }
    return {
      success: result.success,
      token: result.token,
      user: result.user || result.data,
      error: result.error,
    };
  },

  async getCurrentUser(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const token = getStoredToken();
    if (!token) {
      return { success: false, error: 'Non authentifié' };
    }
    const result = await apiRequest<AuthUser>('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return {
      success: result.success,
      user: result.user || result.data,
      error: result.error,
    };
  },

  async logout(): Promise<void> {
    const token = getStoredToken();
    clearStoredToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'same-origin',
      });
    } catch {
      // ignore
    }
  },

  async getUsers(): Promise<{ success: boolean; data?: AuthUser[]; error?: string }> {
    return await apiRequest<AuthUser[]>('/api/auth/users', {
      headers: getAuthHeaders(),
    });
  },

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: 'ADMIN' | 'EDITOR';
  }): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
    return await apiRequest<AuthUser>('/api/auth/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiRequest(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // ================= COMPANY SETTINGS =================
  async getCompanyInfo(): Promise<ApiResult<CompanySettings>> {
    return await apiRequest<CompanySettings>('/api/company');
  },

  async updateCompanyInfo(
    settings: Partial<CompanySettings>
  ): Promise<{ success: boolean; data?: CompanySettings; error?: string }> {
    return await apiRequest<CompanySettings>('/api/company', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
  },

  // ================= STATS =================
  async getStats(): Promise<ApiResult<ServerStats>> {
    return await apiRequest<ServerStats>('/api/stats', {
      headers: getAuthHeaders(),
    });
  },

  // ================= QUOTES (DEVIS) =================
  async submitQuote(formData: QuoteFormData, files: File[] = []): Promise<{
    success: boolean;
    data?: SubmittedQuote;
    whatsappUrl?: string;
    sentToAdmin?: boolean;
    sentToClient?: boolean;
    emailStatus?: {
      sentToAdmin: boolean;
      sentToClient: boolean;
      adminRecipients: string[];
      clientRecipient?: string;
      error?: string;
    };
    legalNotice?: string;
    confirmationNotice?: string;
    error?: string;
  }> {
    try {
      const bodyFormData = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'piecesJointes') {
          bodyFormData.append(key, String(value));
        }
      });

      // Append files
      files.forEach((file) => {
        bodyFormData.append('files', file);
      });

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: bodyFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Erreur lors de la soumission du devis.',
        };
      }
      return data;
    } catch (err: unknown) {
      console.error('Submit quote API error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Impossible de joindre le serveur.';
      return { success: false, error: errorMsg };
    }
  },

  async getQuotes(statusFilter?: string): Promise<ApiResult<SubmittedQuote[]>> {
    const url = statusFilter && statusFilter !== 'Tous'
      ? `/api/quotes?status=${encodeURIComponent(statusFilter)}`
      : '/api/quotes';

    return await apiRequest<SubmittedQuote[]>(url, {
      headers: getAuthHeaders(),
    });
  },

  async updateQuoteStatus(
    id: string,
    status: SubmittedQuote['status'],
    adminNotes?: string,
    finalPrice?: number
  ): Promise<{ success: boolean; data?: SubmittedQuote; error?: string }> {
    return await apiRequest<SubmittedQuote>(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, adminNotes, finalPrice }),
    });
  },

  async deleteQuote(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiRequest(`/api/quotes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async downloadQuoteFile(quoteId: string, fileId: string, filename: string): Promise<boolean> {
    const cleanFileId = fileId.includes('/') ? fileId.split('/').pop() || fileId : fileId;
    const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/files/${encodeURIComponent(cleanFileId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Erreur lors du téléchargement' }));
      throw new Error(errData.error || 'Erreur lors du téléchargement du fichier.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  },

  // ================= CONTACT MESSAGES =================
  async sendContactMessage(msg: {
    name: string;
    emailOrPhone: string;
    subject?: string;
    message: string;
    barka_hp_check?: string;
    _form_rendered_at?: number;
  }): Promise<{
    success: boolean;
    data?: ContactMessage;
    whatsappUrl?: string;
    error?: string;
  }> {
    return await apiRequest<ContactMessage>('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
  },

  async getContactMessages(): Promise<ApiResult<ContactMessage[]>> {
    return await apiRequest<ContactMessage[]>('/api/contact', {
      headers: getAuthHeaders(),
    });
  },

  async updateMessageStatus(id: string, read: boolean, adminReply?: string): Promise<{ success: boolean; data?: ContactMessage; error?: string }> {
    return await apiRequest<ContactMessage>(`/api/contact/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ read, adminReply }),
    });
  },

  async deleteContactMessage(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiRequest(`/api/contact/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // ================= PORTFOLIO =================
  async getPortfolio(category?: string, includeInactive = false): Promise<ApiResult<PortfolioItem[]>> {
    const params = new URLSearchParams();
    if (category && category !== 'Tous') {
      params.append('category', category);
    }
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    const queryStr = params.toString();
    const url = queryStr ? `/api/portfolio?${queryStr}` : '/api/portfolio';
    return await apiRequest<PortfolioItem[]>(url);
  },

  async createPortfolioItem(itemData: FormData | Partial<PortfolioItem>): Promise<{ success: boolean; data?: PortfolioItem; error?: string }> {
    const isFormData = itemData instanceof FormData;
    return await apiRequest<PortfolioItem>('/api/portfolio', {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? itemData : JSON.stringify(itemData),
    });
  },

  async updatePortfolioItem(id: string, updates: FormData | Partial<PortfolioItem>): Promise<{ success: boolean; data?: PortfolioItem; error?: string }> {
    const isFormData = updates instanceof FormData;
    return await apiRequest<PortfolioItem>(`/api/portfolio/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? updates : JSON.stringify(updates),
    });
  },

  async togglePortfolioActive(id: string, active?: boolean): Promise<{ success: boolean; data?: PortfolioItem; error?: string }> {
    return await apiRequest<PortfolioItem>(`/api/portfolio/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ active }),
    });
  },

  async deletePortfolioItem(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiRequest(`/api/portfolio/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async uploadPortfolioImage(file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return await apiRequest<{ imageUrl: string }>('/api/portfolio/upload-image', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
  },

  // ================= SERVICES =================
  async getServices(all = false): Promise<ApiResult<ServiceItem[]>> {
    return await apiRequest<ServiceItem[]>(`/api/services${all ? '?all=true' : ''}`);
  },

  async createService(serviceData: Partial<ServiceItem>): Promise<{ success: boolean; data?: ServiceItem; error?: string }> {
    return await apiRequest<ServiceItem>('/api/services', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData),
    });
  },

  async updateService(id: string, updates: Partial<ServiceItem>): Promise<{ success: boolean; data?: ServiceItem; error?: string }> {
    return await apiRequest<ServiceItem>(`/api/services/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
  },

  async deleteService(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiRequest(`/api/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // ================= PRICES =================
  async getPriceCategories(): Promise<ApiResult<PriceCategory[]>> {
    return await apiRequest<PriceCategory[]>('/api/prices');
  },

  async savePriceItem(
    categoryId: string,
    item: Partial<PriceGridItem>
  ): Promise<{ success: boolean; data?: PriceGridItem; error?: string }> {
    return await apiRequest<PriceGridItem>(`/api/prices/${categoryId}/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
  },

  async deletePriceItem(categoryId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    return await apiRequest(`/api/prices/${categoryId}/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async togglePriceItem(
    categoryId: string,
    itemId: string
  ): Promise<{ success: boolean; data?: PriceGridItem; error?: string }> {
    return await apiRequest<PriceGridItem>(`/api/prices/${categoryId}/items/${itemId}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  // ================= MAILER DIAGNOSTICS & STATUS =================
  async getMailerStatus(): Promise<{
    success: boolean;
    data?: {
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
    };
    error?: string;
  }> {
    return await apiRequest('/api/company/mailer-status', {
      headers: getAuthHeaders(),
    });
  },

  async sendTestEmail(targetEmail?: string): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
    return await apiRequest('/api/company/test-email', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetEmail }),
    });
  },

  // ================= AUDIT LOGS =================
  async getAuditLogs(
    filter?: AuditFilterOptions
  ): Promise<{ success: boolean; logs?: AuditLog[]; count?: number; error?: string }> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.resource && filter.resource !== 'ALL') params.append('resource', filter.resource);
      if (filter.action && filter.action !== 'ALL') params.append('action', filter.action);
      if (filter.role && filter.role !== 'ALL') params.append('role', filter.role);
      if (filter.username) params.append('username', filter.username);
      if (filter.search) params.append('search', filter.search);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.limit) params.append('limit', String(filter.limit));
    }

    const queryString = params.toString();
    const url = `/api/audit${queryString ? `?${queryString}` : ''}`;

    const res = await apiRequest<{ logs: AuditLog[]; count: number }>(url, {
      headers: getAuthHeaders(),
    });

    return {
      success: res.success,
      logs: res.logs || res.data?.logs || (Array.isArray(res.data) ? res.data : undefined),
      count: res.count || res.data?.count,
      error: res.error,
    };
  },

  async getAuditStats(): Promise<{
    success: boolean;
    stats?: {
      totalLogs: number;
      byRole: Record<string, number>;
      byAction: Record<string, number>;
      byResource: Record<string, number>;
      recentLogsCount: number;
    };
    error?: string;
  }> {
    const res = await apiRequest<{ stats: any }>('/api/audit/stats', {
      headers: getAuthHeaders(),
    });
    return {
      success: res.success,
      stats: res.stats || res.data?.stats || res.data,
      error: res.error,
    };
  },

  async getAuditLogById(id: string): Promise<{ success: boolean; log?: AuditLog; error?: string }> {
    const res = await apiRequest<AuditLog>(`/api/audit/${id}`, {
      headers: getAuthHeaders(),
    });
    return {
      success: res.success,
      log: res.log || res.data,
      error: res.error,
    };
  },
};

