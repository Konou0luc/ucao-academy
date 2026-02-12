"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BookOpen, PlusCircle, Pencil, Trash2, Search, Eye } from "lucide-react";
import { courses as coursesApi } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";

const DEBOUNCE_MS = 400;

type CourseItem = {
  _id: string;
  title: string;
  category: string;
  status: string;
  filiere?: string;
  niveau?: string;
  description?: string;
};

export default function FormateurCoursPage() {
  const [list, setList] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback((searchTerm: string) => {
    setLoading(true);
    coursesApi
      .getMine({ search: searchTerm || undefined })
      .then((data: CourseItem[] | { message?: string }) => {
        if (Array.isArray(data)) setList(data);
        else setList([]);
      })
      .catch(() => {
        setList([]);
        toast.error("Impossible de charger vos cours.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load(search);
  }, [search, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce cours ?")) return;
    try {
      const res = await coursesApi.delete(id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
        return;
      }
      toast.success("Cours supprimé.");
      setList((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const statusLabel: Record<string, string> = {
    published: "Publié",
    draft: "Brouillon",
    archived: "Archivé",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
              <p className="text-sm text-gray-600 mt-1">Créez et gérez vos cours.</p>
            </div>
            <Link
          href="/formateur/cours/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition"
        >
          <PlusCircle className="w-5 h-5" />
          Nouveau cours
            </Link>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher (titre, catégorie)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
            />
          </div>
        </div>

      {loading ? (
        <LoadingScreen message="Chargement des cours..." withSound={false} className="py-12 rounded-xl" />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">Aucun cours pour le moment.</p>
          <Link
            href="/formateur/cours/nouveau"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
          >
            <PlusCircle className="w-5 h-5" />
            Créer un cours
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Catégorie</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.title}</p>
                    {(c.filiere || c.niveau) && (
                      <p className="text-xs text-gray-500">
                        {c.filiere || "—"} · {c.niveau === "licence1" ? "L1" : c.niveau === "licence2" ? "L2" : c.niveau === "licence3" ? "L3" : c.niveau || "—"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        c.status === "published"
                          ? "bg-green-100 text-green-800"
                          : c.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/formateur/cours/${c._id}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Voir (détails et vidéo)"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/formateur/cours/${c._id}/edit`}
                        className="p-2 text-[#03045e] hover:bg-[#03045e]/10 rounded-lg transition"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(c._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
