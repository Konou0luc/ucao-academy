"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { guides as guidesApi } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";

const PAGE_SIZE = 20;

type GuideItem = { _id: string; title: string; content: string; status: string; order?: number };

export default function AdminGuidesPage() {
  const [list, setList] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GuideItem | null>(null);
  const [form, setForm] = useState({ title: "", content: "", status: "published" as string });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    guidesApi
      .getAll()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ title: "", content: "", status: "published" });
  };

  const handleEdit = (g: GuideItem) => {
    setEditing(g);
    setCreating(false);
    setForm({ title: g.title, content: g.content, status: g.status || "published" });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    setSaving(true);
    try {
      await guidesApi.create({ title: form.title.trim(), content: form.content.trim() || "", status: form.status });
      toast.success("Guide créé.");
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
      await guidesApi.update(editing._id, { title: form.title.trim(), content: form.content.trim() || "", status: form.status });
      toast.success("Guide enregistré.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: GuideItem) => {
    if (!confirm(`Supprimer le guide « ${g.title} » ?`)) return;
    try {
      await guidesApi.delete(g._id);
      toast.success("Guide supprimé.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Guides</h1>
      <p className="text-gray-600 mb-6">Les guides sont visibles par les étudiants dans la section Guides.</p>
      <button
        type="button"
        onClick={handleCreate}
        className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0 mb-6"
      >
        + Ajouter un guide
      </button>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouveau guide</h2>
          <form onSubmit={handleSaveCreate} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Ex. Guide de prise en main"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Contenu du guide (texte ou HTML simple)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
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
          Aucun guide. Ajoutez-en un pour qu’il apparaisse côté étudiant.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g._id} className="border-b border-gray-100 hover:bg-gray-50">
                  {editing?._id === g._id ? (
                    <>
                      <td colSpan={2} className="px-4 py-3">
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
                          <select
                            value={form.status}
                            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900"
                          >
                            <option value="published">Publié</option>
                            <option value="draft">Brouillon</option>
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
                      <td className="px-4 py-3 font-medium text-gray-900">{g.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${g.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                          {g.status === "published" ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button type="button" onClick={() => handleEdit(g)} className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm">
                          Modifier
                        </button>
                        <button type="button" onClick={() => handleDelete(g)} className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm">
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
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="guide" />
    </div>
  );
}
