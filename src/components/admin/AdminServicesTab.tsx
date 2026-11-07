import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  Search,
  Check,
  X,
} from 'lucide-react';
import { ServiceItem, ServiceGroupId } from '../../types';

interface AdminServicesTabProps {
  services: ServiceItem[];
  onSaveService: (service: ServiceItem) => void;
  onDeleteService: (id: string) => void;
  onToggleActiveService: (id: string, active: boolean) => void;
}

export const AdminServicesTab: React.FC<AdminServicesTabProps> = ({
  services,
  onSaveService,
  onDeleteService,
  onToggleActiveService,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('Tous');
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<{
    id: string;
    groupId: ServiceGroupId;
    groupTitle: string;
    category: string;
    title: string;
    shortDesc: string;
    fullDesc: string;
    iconName: string;
    image: string;
    features: string;
    popular: boolean;
    active: boolean;
    priceStartingAt: number;
    quoteTypePrestation: string;
  }>({
    id: '',
    groupId: 'imprimerie',
    groupTitle: 'Imprimerie',
    category: '',
    title: '',
    shortDesc: '',
    fullDesc: '',
    iconName: 'Layers',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    features: '',
    popular: false,
    active: true,
    priceStartingAt: 5000,
    quoteTypePrestation: '',
  });

  const handleOpenAdd = () => {
    setEditingService(null);
    setForm({
      id: `srv-${Date.now()}`,
      groupId: 'imprimerie',
      groupTitle: 'Imprimerie',
      category: 'Impression générale',
      title: '',
      shortDesc: '',
      fullDesc: '',
      iconName: 'Layers',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      features: 'Haute résolution\nFinitions soignées\nLivraison rapide',
      popular: false,
      active: true,
      priceStartingAt: 5000,
      quoteTypePrestation: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: ServiceItem) => {
    setEditingService(item);
    setForm({
      id: item.id,
      groupId: item.groupId,
      groupTitle: item.groupTitle,
      category: item.category,
      title: item.title,
      shortDesc: item.shortDesc,
      fullDesc: item.fullDesc,
      iconName: item.iconName,
      image: item.image,
      features: (item.features || []).join('\n'),
      popular: Boolean(item.popular),
      active: item.active !== false,
      priceStartingAt: item.priceStartingAt || 5000,
      quoteTypePrestation: item.quoteTypePrestation || item.title,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceToSave: ServiceItem = {
      id: form.id || `srv-${Date.now()}`,
      groupId: form.groupId,
      groupTitle:
        form.groupId === 'imprimerie'
          ? 'Imprimerie'
          : form.groupId === 'communication-branding'
          ? 'Communication & Branding'
          : 'Solutions Professionnelles',
      category: form.category || 'Général',
      title: form.title,
      shortDesc: form.shortDesc,
      fullDesc: form.fullDesc || form.shortDesc,
      iconName: form.iconName || 'Layers',
      image: form.image || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      features: form.features.split('\n').filter((f) => f.trim().length > 0),
      popular: form.popular,
      active: form.active,
      priceStartingAt: Number(form.priceStartingAt) || 0,
      quoteTypePrestation: form.quoteTypePrestation || form.title,
    };

    onSaveService(serviceToSave);
    setShowModal(false);
  };

  const filteredServices = services.filter((srv) => {
    const matchesGroup = filterGroup === 'Tous' || srv.groupId === filterGroup;
    const matchesSearch =
      !searchQuery.trim() ||
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">Gestion des Services & Prestations</h3>
          <p className="text-xs text-slate-500">
            Consultez, modifiez, activez ou désactivez les offres affichées sur le catalogue public.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          Nouveau Service
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un service par nom, catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          {['Tous', 'imprimerie', 'communication-branding', 'solutions-pro'].map((grp) => (
            <button
              key={grp}
              onClick={() => setFilterGroup(grp)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterGroup === grp
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {grp === 'Tous'
                ? 'Tous les pôles'
                : grp === 'imprimerie'
                ? '1. Imprimerie'
                : grp === 'communication-branding'
                ? '2. Communication'
                : '3. Solutions Pro'}
            </button>
          ))}
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Service</th>
              <th className="p-4">Pôle & Catégorie</th>
              <th className="p-4">Prix d'accroche</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Aucun service trouvé.
                </td>
              </tr>
            ) : (
              filteredServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={srv.image}
                        alt={srv.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {srv.title}
                          {srv.popular && (
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                              Populaire
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">{srv.shortDesc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-700 block">{srv.groupTitle}</span>
                    <span className="text-[10px] text-slate-400">{srv.category}</span>
                  </td>
                  <td className="p-4 font-bold text-emerald-700">
                    {srv.priceStartingAt ? `Dès ${srv.priceStartingAt.toLocaleString('fr-FR')} FCFA` : 'Sur devis'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => onToggleActiveService(srv.id, srv.active === false)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                        srv.active !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {srv.active !== false ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Actif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" /> Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(srv)}
                        className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Modifier ce service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer définitivement le service "${srv.title}" ?`)) {
                            onDeleteService(srv.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Supprimer ce service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Service */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingService ? 'Modifier le service' : 'Ajouter un nouveau service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pôle Principal</label>
                  <select
                    value={form.groupId}
                    onChange={(e) => setForm({ ...form, groupId: e.target.value as ServiceGroupId })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="imprimerie">1. Imprimerie (Offset, Numérique, Sérigraphie)</option>
                    <option value="communication-branding">2. Communication & Branding (Signalétique, Graphisme)</option>
                    <option value="solutions-pro">3. Solutions Professionnelles (Informatique, BTP, Fournitures)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Catégorie</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="ex: Impression Grand format, Papeterie..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Titre du service</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  placeholder="ex: Sérigraphie textile & Marquage publicitaire"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description courte (accroche)</label>
                <input
                  type="text"
                  required
                  value={form.shortDesc}
                  onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="ex: Impression directe par cadre sur t-shirts, polos et bâches..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description détaillée (modal)</label>
                <textarea
                  rows={3}
                  value={form.fullDesc}
                  onChange={(e) => setForm({ ...form, fullDesc: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="Présentation complète des capacités machines et finitions d'atelier..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Prix de départ (FCFA)</label>
                  <input
                    type="number"
                    value={form.priceStartingAt}
                    onChange={(e) => setForm({ ...form, priceStartingAt: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">URL de l'image</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Points forts (1 par ligne)</label>
                <textarea
                  rows={3}
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="Qualité CMJN garantie&#10;Encres haute tenue&#10;Livraison express"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  <span className="font-bold text-slate-700">Mettre à la une (Populaire)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  <span className="font-bold text-slate-700">Service Actif sur le site</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
