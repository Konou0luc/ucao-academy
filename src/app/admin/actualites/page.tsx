"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { news as newsApi } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";

const PAGE_SIZE = 20;

type NewsItem = {
  _id: string;
  title: string;
  content: string;
  image?: string | null;
  status: string;
  created_by?: { name: string };
  createdAt?: string;
};

export default function AdminActualitesPage() {
  const [list, setList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: "", content: "", status: "draft" as string, image: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = statusFilter === "draft" || statusFilter === "published" ? { status: statusFilter } : undefined;
    newsApi
      .getAll({ ...params, limit: PAGE_SIZE, page })
      .then((res: NewsItem[] | { data: NewsItem[]; total: number }) => {
        if (Array.isArray(res)) {
          setList(res);
          setTotal(res.length);
        } else {
          setList(res.data || []);
          setTotal(res.total ?? 0);
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ title: "", content: "", status: "draft", image: "" });
  };

  const handleEdit = (n: NewsItem) => {
    setEditing(n);
    setCreating(false);
    setForm({
      title: n.title,
      content: n.content,
      status: n.status || "draft",
      image: n.image || "",
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    setSaving(true);
    try {
      await newsApi.create({
        title: form.title.trim(),
        content: form.content.trim() || "",
        status: form.status,
        ...(form.image.trim() ? { image: form.image.trim() } : {}),
      });
      toast.success("Actualité créée.");
      setCreating(false);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await newsApi.update(editing._id, {
        title: form.title.trim(),
        content: form.content.trim() || "",
        status: form.status,
        ...(form.image.trim() ? { image: form.image.trim() } : {}),
      });
      toast.success("Actualité enregistrée.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (n: NewsItem) => {
    if (!confirm(`Supprimer l'actualité « ${n.title} » ?`)) return;
    try {
      await newsApi.delete(n._id);
      toast.success("Actualité supprimée.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Actualités</h1>
      <p className="text-gray-600 mb-6">Les actualités publiées sont visibles par les étudiants sur la page Actualités.</p>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
          >
            <option value="">Toutes</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0 mt-6"
        >
          + Ajouter une actualité
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle actualité</h2>
          <form onSubmit={handleSaveCreate} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Titre de l'actualité"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Contenu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image (URL optionnelle)</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium">
                {saving ? "Création..." : "Créer"}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">
          Aucune actualité. Ajoutez-en une pour qu’elle apparaisse côté étudiant (une fois publiée).
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Créé le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n._id} className="border-b border-gray-100 hover:bg-gray-50">
                  {editing?._id === n._id ? (
                    <>
                      <td colSpan={3} className="px-4 py-3">
                        <form onSubmit={handleSaveEdit} className="space-y-3">
                          <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Titre"
                            required
                          />
                          <textarea
                            value={form.content}
                            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Contenu"
                          />
                          <input
                            type="url"
                            value={form.image}
                            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                            placeholder="URL image (optionnel)"
                          />
                          <select
                            value={form.status}
                            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900"
                          >
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                          </select>
                          <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm">
                              Enregistrer
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm">
                              Annuler
                            </button>
                          </div>
                        </form>
                      </td>
                      <td className="px-4 py-3"></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{n.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${n.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                          {n.status === "published" ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button type="button" onClick={() => handleEdit(n)} className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm">
                          Modifier
                        </button>
                        <button type="button" onClick={() => handleDelete(n)} className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm">
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
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="actualité" />
    </div>
  );
}
