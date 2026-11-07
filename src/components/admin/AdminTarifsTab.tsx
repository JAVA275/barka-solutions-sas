import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Search,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { PriceCategory, PriceGridItem } from '../../types';

interface AdminTarifsTabProps {
  categories: PriceCategory[];
  onSaveCategoryItem: (categoryId: string, item: PriceGridItem) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onToggleActiveItem: (categoryId: string, itemId: string, active: boolean) => void;
}

export const AdminTarifsTab: React.FC<AdminTarifsTabProps> = ({
  categories,
  onSaveCategoryItem,
  onDeleteItem,
  onToggleActiveItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || 'all');
  const [showModal, setShowModal] = useState(false);
  const [targetCatId, setTargetCatId] = useState<string>(categories[0]?.id || 'carnets');
  const [editingItem, setEditingItem] = useState<PriceGridItem | null>(null);

  const [form, setForm] = useState<{
    id: string;
    name: string;
    category: string;
    format: string;
    specs: string;
    unitPrice: string | number;
    unit: string;
    popular: boolean;
    active: boolean;
    minQty: string;
    notes: string;
  }>({
    id: '',
    name: '',
    category: '',
    format: '',
    specs: '',
    unitPrice: 1000,
    unit: 'FCFA / unité',
    popular: false,
    active: true,
    minQty: '1',
    notes: '',
  });

  const handleOpenAdd = (catId?: string) => {
    setEditingItem(null);
    const chosenCat = catId || (selectedCatId !== 'all' ? selectedCatId : categories[0]?.id || 'carnets');
    const catObj = categories.find((c) => c.id === chosenCat);
    setTargetCatId(chosenCat);
    setForm({
      id: `price-${Date.now()}`,
      name: '',
      category: catObj?.name || 'Prestations',
      format: 'Standard',
      specs: '',
      unitPrice: 1500,
      unit: 'FCFA / unité',
      popular: false,
      active: true,
      minQty: '1',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (catId: string, item: PriceGridItem) => {
    setEditingItem(item);
    setTargetCatId(catId);
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      format: item.format || '',
      specs: item.specs || '',
      unitPrice: item.unitPrice,
      unit: item.unit || 'FCFA / unité',
      popular: Boolean(item.popular),
      active: item.active !== false,
      minQty: item.minQty || '1',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSave: PriceGridItem = {
      id: form.id || `price-${Date.now()}`,
      name: form.name,
      category: form.category || 'Prestation',
      format: form.format,
      specs: form.specs,
      unitPrice: Number(form.unitPrice) || form.unitPrice,
      unit: form.unit || 'FCFA',
      popular: form.popular,
      active: form.active,
      minQty: form.minQty,
      notes: form.notes,
    };

    onSaveCategoryItem(targetCatId, itemToSave);
    setShowModal(false);
  };

  // Flatten or filter items
  const activeCategories = selectedCatId === 'all'
    ? categories
    : categories.filter((c) => c.id === selectedCatId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">Gestion des Grilles Tarifaires & Prix de Base</h3>
          <p className="text-xs text-slate-500">
            Ajustez les prix de référence en FCFA pour les carnets, affiches, banderoles, tampons et sérigraphie.
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          Ajouter une ligne tarifaire
        </button>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un produit, format, papier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCatId === 'all'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCatId === cat.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Categories Tables */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2 shadow-xs">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Aucune catégorie de tarifs enregistrée</h4>
            <p className="text-xs text-slate-500">Ajoutez une première ligne pour initialiser la grille tarifaire.</p>
          </div>
        ) : (
          activeCategories.map((cat) => {
          const itemsToDisplay = (cat.items || []).filter((it) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              it.name.toLowerCase().includes(q) ||
              (it.format && it.format.toLowerCase().includes(q)) ||
              (it.specs && it.specs.toLowerCase().includes(q))
            );
          });

          if (itemsToDisplay.length === 0 && searchQuery.trim()) return null;

          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                  <p className="text-[11px] text-slate-500">{cat.description}</p>
                </div>
                <button
                  onClick={() => handleOpenAdd(cat.id)}
                  className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter dans cette catégorie
                </button>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/40 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Produit / Désignation</th>
                    <th className="p-3.5">Format & Spécifications</th>
                    <th className="p-3.5">Tarif Unitaire (FCFA)</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemsToDisplay.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {item.name}
                          {item.popular && (
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                              À la une
                            </span>
                          )}
                        </div>
                        {item.notes && <span className="text-[10px] text-slate-400 block">{item.notes}</span>}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="font-semibold block">{item.format || 'Standard'}</span>
                        {item.specs && <span className="text-[10px] text-slate-400">{item.specs}</span>}
                      </td>
                      <td className="p-3.5">
                        <span className="font-black text-emerald-700 text-sm">
                          {typeof item.unitPrice === 'number'
                            ? `${item.unitPrice.toLocaleString('fr-FR')} FCFA`
                            : item.unitPrice}
                        </span>
                        {item.unit && <span className="text-[10px] text-slate-400 block">{item.unit}</span>}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => onToggleActiveItem(cat.id, item.id, item.active === false)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            item.active !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {item.active !== false ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(cat.id, item)}
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Modifier ce tarif"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer la ligne tarifaire "${item.name}" ?`)) {
                                onDeleteItem(cat.id, item.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
      </div>

      {/* Modal Add/Edit Tarif */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Modifier le tarif' : 'Nouvelle ligne tarifaire'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Catégorie cible</label>
                <select
                  value={targetCatId}
                  onChange={(e) => setTargetCatId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Désignation du produit</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  placeholder="ex: Carnet Autocopiant Tripli (50 liasses)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Format</label>
                  <input
                    type="text"
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="ex: A4, A5, 8.5x5.5 cm..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Prix Unitaire (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unité / Libellé</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="ex: FCFA / carnet, FCFA / lot"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quantité Min.</label>
                  <input
                    type="text"
                    value={form.minQty}
                    onChange={(e) => setForm({ ...form, minQty: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="ex: 1, 100 ex"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Spécifications techniques</label>
                <input
                  type="text"
                  value={form.specs}
                  onChange={(e) => setForm({ ...form, specs: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="ex: Papier 80g satiné, numéroté, agrafé"
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
                  <span className="font-bold text-slate-700">Mettre en avant</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  <span className="font-bold text-slate-700">Tarif Actif</span>
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
