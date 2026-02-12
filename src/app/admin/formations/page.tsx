"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye } from "lucide-react";
import { admin, courses } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

const SEMESTRES = [
  { value: "", label: "Tous les semestres" },
  { value: "harmattan", label: "Harmattan" },
  { value: "mousson", label: "Mousson" },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface CourseRow {
  id: string;
  _id?: string;
  title: string;
  category: string;
  status: string;
  niveau?: string | null;
  user?: { name: string; email: string };
  semester?: string | null;
  academic_year?: number | null;
}

const DEBOUNCE_MS = 400;

const formatNiveau = (niveau: string | null | undefined) => {
  if (!niveau) return "—";
  if (niveau === "licence1") return "Licence 1";
  if (niveau === "licence2") return "Licence 2";
  if (niveau === "licence3") return "Licence 3";
  return niveau;
};

function toCourseRow(
  c: {
    _id?: string;
    id?: string;
    title: string;
    category: string;
    status: string;
    niveau?: string | null;
    created_by?: { name?: string; email?: string };
    user?: { name?: string; email?: string };
    semester?: string | null;
    academic_year?: number | null;
    [key: string]: unknown;
  }
): CourseRow {
  const raw = c.created_by ?? c.user;
  const user: { name: string; email: string } | undefined = raw
    ? { name: raw.name ?? "", email: raw.email ?? "" }
    : undefined;
  return {
    ...c,
    id: c.id ?? c._id ?? "",
    user,
  };
}

export default function CoursAdmin() {
  const [cours, setCours] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterYear, setFilterYear] = useState<number | "">(""); // "Toutes" par défaut pour voir tous les cours (ex. seed RIT 2025)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();
  const [courseToDelete, setCourseToDelete] = useState<CourseRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback((searchTerm: string, semester: string, academicYear: number | "", pageNum: number) => {
    setLoading(true);
    setError("");
    admin
      .getCourses({
        search: searchTerm || undefined,
        semester: semester || undefined,
        academic_year: academicYear !== "" ? academicYear : undefined,
        limit: PAGE_SIZE,
        page: pageNum,
      })
      .then((res: { _id?: string; id?: string; title: string; category: string; status: string; niveau?: string | null; created_by?: { name?: string; email?: string }; user?: { name?: string; email?: string }; semester?: string | null; academic_year?: number | null }[] | { data: unknown[]; total: number }) => {
        if (Array.isArray(res)) {
          setCours(res.map((c) => toCourseRow(c)));
          setTotal(res.length);
        } else {
          const list = (res as { data: unknown[] }).data || [];
          setCours(list.map((c) => toCourseRow(c as Parameters<typeof toCourseRow>[0])));
          setTotal((res as { total: number }).total ?? 0);
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement des cours.";
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
    load(search, filterSemester, filterYear, page);
  }, [search, filterSemester, filterYear, page, load]);

  // Gestion suppression
  const handleDelete = async () => {
    if (!courseToDelete) return;
    setError("");
    setSuccess("");
    setDeleteLoading(true);
    try {
      const res = await courses.delete(courseToDelete.id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as { message?: string }).message ?? "Erreur lors de la suppression.";
        setError(msg);
        toast.error(msg);
        return;
      }
      setCours((prev) => prev.filter((f) => f.id !== courseToDelete.id));
      setSuccess("Cours supprimé avec succès.");
      toast.success("Cours supprimé avec succès.");
      load(search, filterSemester, filterYear, page);
    } catch (e: unknown) {
      const msg = typeof e === "object" && e && "message" in e ? (e as { message: string }).message : "Erreur inconnue.";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setCourseToDelete(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des cours</h1>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (titre, catégorie)</label>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
          >
            {SEMESTRES.map((s) => (
              <option key={s.value || "all"} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
          <select
            value={filterYear === "" ? "" : filterYear}
            onChange={(e) => setFilterYear(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
          >
            <option value="">Toutes</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}–{y + 1}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => router.push("/admin/formations/nouveau")}
          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0"
        >
          + Ajouter un cours
        </button>
      </div>
        {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}
        {success && <div className="mb-4 text-green-500 font-semibold">{success}</div>}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Chargement...</div>
        ) : cours.length === 0 ? (
          <div className="text-center py-12 text-gray-600 bg-white rounded-xl border border-gray-100">Aucun cours trouvé.</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Titre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Catégorie</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Niveau</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semestre / Année</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Formateur</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cours.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.title}</td>
                    <td className="px-4 py-3 text-gray-600">{f.category}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNiveau(f.niveau)}</td>
                    <td className="px-4 py-3">
                      <span className={
                        f.status === "published"
                          ? "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                          : f.status === "draft"
                          ? "bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium"
                          : "bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                      }>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[f.semester, f.academic_year != null ? `${f.academic_year}–${f.academic_year + 1}` : null].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.user?.name || "—"}</td>
                    <td className="px-4 py-3 flex gap-2 items-center">
                      <button
                        onClick={() => router.push(`/admin/formations/${f.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Voir les détails et la vidéo du cours"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/formations/${f.id}/edit`)}
                        className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm"
                      >
                        Éditer
                      </button>
                    <button
                      onClick={() => setCourseToDelete(f)}
                      className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm"
                    >
                      Supprimer
                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="cours" />

      <ConfirmDialog
        open={!!courseToDelete}
        title="Supprimer le cours"
        description={
          courseToDelete ? (
            <p>
              Vous êtes sur le point de supprimer définitivement le cours{" "}
              <span className="font-semibold">{courseToDelete.title}</span>.{" "}
              Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            </p>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => !deleteLoading && setCourseToDelete(null)}
      />
    </div>
  );
}