"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { admin } from "@/lib/api";
import { INSTITUTES } from "@/lib/filieres";
import PaginationBar from "@/components/PaginationBar";

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;

type FiliereItem = {
  _id: string;
  institut: string;
  name: string;
  order?: number;
};

const INSTITUTE_LABEL: Record<string, string> = {
  DGI: "DGI",
  ISSJ: "ISSJ",
  ISEG: "ISEG",
};

export default function FilieresAdmin() {
  const [filieres, setFilieres] = useState<FiliereItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FiliereItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ institut: "DGI", name: "", order: 0 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterInstitute, setFilterInstitute] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback((searchTerm: string, institute?: string, pageNum?: number) => {
    setLoading(true);
    setError("");
    admin
      .getFilieres({
        search: searchTerm || undefined,
        institute: institute || undefined,
        limit: PAGE_SIZE,
        page: pageNum ?? 1,
      })
      .then((res: FiliereItem[] | { data: FiliereItem[]; total: number }) => {
        if (Array.isArray(res)) {
          setFilieres(res);
          setTotal(res.length);
        } else {
          setFilieres(res.data || []);
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
    load(search, filterInstitute || undefined, page);
  }, [search, filterInstitute, page, load]);

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ institut: "DGI", name: "", order: 0 });
  };

  const handleEdit = (item: FiliereItem) => {
    setEditing(item);
    setCreating(false);
    setForm({
      institut: item.institut,
      name: item.name,
      order: item.order ?? 0,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    setSaving(true);
    try {
      await admin.createFiliere({
        institut: form.institut,
        name: form.name.trim(),
        order: form.order,
      });
      toast.success("Filière créée.");
      setCreating(false);
      load(search, filterInstitute || undefined, page);
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
      await admin.updateFiliere(editing._id, {
        name: form.name.trim(),
        order: form.order,
      });
      toast.success("Filière enregistrée.");
      setEditing(null);
      load(search, filterInstitute || undefined);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: FiliereItem) => {
    if (!confirm(`Supprimer la filière « ${item.name} » ?`)) return;
    try {
      const res = await admin.deleteFiliere(item._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
        return;
      }
      toast.success("Filière supprimée.");
      setEditing(null);
      load(search, filterInstitute || undefined, page);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Filières</h1>
      <p className="text-gray-600 mb-6">
        Les filières sont utilisées dans les formulaires (inscription, cours, emplois du temps, etc.). Vous pouvez les modifier ici sans toucher au code.
      </p>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">Institut</label>
          <select
            value={filterInstitute}
            onChange={(e) => setFilterInstitute(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
          >
            <option value="">Tous</option>
            {INSTITUTES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-0 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (nom)</label>
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
          + Ajouter une filière
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle filière</h2>
          <form onSubmit={handleSaveCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institut *</label>
              <select
                value={form.institut}
                onChange={(e) => setForm((f) => ({ ...f, institut: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
                required
              >
                {INSTITUTES.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Ex. Développement d'application (DA)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d&apos;affichage</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                min={0}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
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
      ) : filieres.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">
          Aucune filière. Ajoutez-en une pour les utiliser dans les formulaires.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Ordre</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filieres.map((item) => (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  {editing?._id === item._id ? (
                    <>
                      <td colSpan={3} className="px-4 py-3">
                        <form onSubmit={handleSaveEdit} className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-gray-500">{INSTITUTE_LABEL[item.institut] ?? item.institut}</span>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm flex-1 min-w-[200px]"
                            placeholder="Nom"
                            required
                          />
                          <input
                            type="number"
                            value={form.order}
                            onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm w-20"
                            min={0}
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
                      <td className="px-4 py-3 text-gray-600">{INSTITUTE_LABEL[item.institut] ?? item.institut}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.order ?? 0}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
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
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="filière" />
    </div>
  );
}
