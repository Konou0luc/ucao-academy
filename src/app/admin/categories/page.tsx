"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { admin } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;

type CategoryItem = {
  _id: string;
  name: string;
  description?: string;
  order?: number;
};

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback((searchTerm: string, pageNum: number) => {
    setLoading(true);
    setError("");
    admin
      .getCategories({ search: searchTerm || undefined, limit: PAGE_SIZE, page: pageNum })
      .then((res: CategoryItem[] | { data: CategoryItem[]; total: number }) => {
        if (Array.isArray(res)) {
          setCategories(res);
          setTotal(res.length);
        } else {
          setCategories(res.data || []);
          setTotal(res.total ?? 0);
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load(search, page);
  }, [search, page, load]);

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: "", description: "" });
  };

  const handleEdit = (cat: CategoryItem) => {
    setEditing(cat);
    setCreating(false);
    setForm({ name: cat.name, description: cat.description ?? "" });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    setSaving(true);
    try {
      await admin.createCategory({ name: form.name.trim(), description: form.description.trim() || undefined });
      toast.success("Catégorie créée.");
      setCreating(false);
      // Recharge la liste (retour page 1 pour voir la nouvelle catégorie)
      setPage(1);
      load(search, 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form.name.trim()) return;
    setSaving(true);
    try {
      await admin.updateCategory(editing._id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      toast.success("Catégorie enregistrée.");
      setEditing(null);
      load(search, page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Supprimer la catégorie « ${cat.name} » ?`)) return;
    try {
      const res = await admin.deleteCategory(cat._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
        return;
      }
      toast.success("Catégorie supprimée.");
      setEditing(null);
      load(search, page);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catégories de cours</h1>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (nom, description)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0"
        >
          + Ajouter une catégorie
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle catégorie</h2>
          <form onSubmit={handleSaveCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Ex. Technologie"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Optionnel"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
              >
                {saving ? "Création..." : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">
          Aucune catégorie. Ajoutez-en une pour lier les cours.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  {editing?._id === cat._id ? (
                    <>
                      <td colSpan={2} className="px-4 py-3">
                        <form onSubmit={handleSaveEdit} className="flex flex-wrap items-center gap-3">
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm w-48"
                            placeholder="Nom"
                            required
                          />
                          <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm flex-1 min-w-[200px]"
                            placeholder="Description"
                          />
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm"
                          >
                            Annuler
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3"></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-600">{cat.description || "—"}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(cat)}
                          className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm"
                        >
                          Supprimer
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="catégorie" />
    </div>
  );
}
