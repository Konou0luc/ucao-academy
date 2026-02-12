"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { outils as outilsApi } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";

const PAGE_SIZE = 20;

type OutilItem = { _id: string; title: string; description?: string; url: string; order?: number };

export default function AdminOutilsPage() {
  const [list, setList] = useState<OutilItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<OutilItem | null>(null);
  const [form, setForm] = useState({ title: "", description: "", url: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    outilsApi
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
    setForm({ title: "", description: "", url: "" });
  };

  const handleEdit = (o: OutilItem) => {
    setEditing(o);
    setCreating(false);
    setForm({ title: o.title, description: o.description ?? "", url: o.url });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Titre et URL sont requis.");
      return;
    }
    setSaving(true);
    try {
      await outilsApi.create({ title: form.title.trim(), description: form.description.trim() || undefined, url: form.url.trim() });
      toast.success("Outil créé.");
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
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      await outilsApi.update(editing._id, { title: form.title.trim(), description: form.description.trim() || undefined, url: form.url.trim() });
      toast.success("Outil enregistré.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (o: OutilItem) => {
    if (!confirm(`Supprimer l'outil « ${o.title} » ?`)) return;
    try {
      await outilsApi.delete(o._id);
      toast.success("Outil supprimé.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Outils</h1>
      <p className="text-gray-600 mb-6">Liens utiles affichés aux étudiants dans la section Outils.</p>
      <button
        type="button"
        onClick={handleCreate}
        className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0 mb-6"
      >
        + Ajouter un outil
      </button>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvel outil</h2>
          <form onSubmit={handleSaveCreate} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Ex. Moodle, Bibliothèque..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="https://..."
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
          Aucun outil. Ajoutez des liens utiles pour les étudiants.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">URL</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o._id} className="border-b border-gray-100 hover:bg-gray-50">
                  {editing?._id === o._id ? (
                    <>
                      <td colSpan={2} className="px-4 py-3">
                        <form onSubmit={handleSaveEdit} className="flex flex-wrap items-center gap-3">
                          <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm w-40"
                            placeholder="Titre"
                            required
                          />
                          <input
                            type="url"
                            value={form.url}
                            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm flex-1 min-w-[200px]"
                            placeholder="URL"
                            required
                          />
                          <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-900 text-sm w-48"
                            placeholder="Description"
                          />
                          <button type="submit" disabled={saving} className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm">
                            Enregistrer
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm">
                            Annuler
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3"></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.title}</td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                        <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-[#03045e] hover:underline">
                          {o.url}
                        </a>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button type="button" onClick={() => handleEdit(o)} className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm">
                          Modifier
                        </button>
                        <button type="button" onClick={() => handleDelete(o)} className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm">
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
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="outil" />
    </div>
  );
}
