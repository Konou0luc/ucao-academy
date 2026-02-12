"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { admin } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

const INSTITUTS = ["DGI", "ISSJ", "ISEG"] as const;
const SEMESTRES = [
  { value: "harmattan", label: "Harmattan" },
  { value: "mousson", label: "Mousson" },
];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

type AssignmentItem = {
  _id: string;
  user_id: { _id: string; name: string; email?: string };
  course_id: { _id: string; title: string; filiere?: string; niveau?: string };
  institut: string;
  semester: string;
  academic_year: number;
};

type FormateurOption = { _id: string; name: string; email?: string };
type CourseOption = { _id: string; title: string };

export default function AffectationsAdmin() {
  const [list, setList] = useState<AssignmentItem[]>([]);
  const [formateurs, setFormateurs] = useState<FormateurOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AssignmentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [filterInstitut, setFilterInstitut] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterYear, setFilterYear] = useState<number | "">(CURRENT_YEAR);
  const [form, setForm] = useState({
    user_id: "",
    institut: "" as "" | "DGI" | "ISSJ" | "ISEG",
    semester: "" as "" | "harmattan" | "mousson",
    academic_year: CURRENT_YEAR as number | "",
    course_id: "",
  });
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const institut = filterInstitut || undefined;
    const semester = filterSemester || undefined;
    const academic_year = filterYear !== "" ? filterYear : undefined;
    admin
      .getInstructorAssignments({ institut, semester, academic_year })
      .then((data: AssignmentItem[]) => setList(Array.isArray(data) ? data : []))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur chargement.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [filterInstitut, filterSemester, filterYear]);

  useEffect(() => {
    setPage(1);
  }, [filterInstitut, filterSemester, filterYear]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    admin.getUsers({ role: "formateur" }).then((data: FormateurOption[]) => setFormateurs(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const institut = form.institut || undefined;
    const semester = form.semester || undefined;
    const academic_year = form.academic_year !== "" && form.academic_year != null ? form.academic_year : undefined;
    admin.getCourses({ institut, semester, academic_year }).then((data: CourseOption[]) => setCourses(Array.isArray(data) ? data : [])).catch(() => {});
  }, [form.institut, form.semester, form.academic_year]);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      user_id: "",
      institut: "",
      semester: "",
      academic_year: CURRENT_YEAR,
      course_id: "",
    });
  };

  const openEdit = (item: AssignmentItem) => {
    setEditing(item);
    setCreating(false);
    setForm({
      user_id: item.user_id?._id ?? "",
      institut: (item.institut as "" | "DGI" | "ISSJ" | "ISEG") ?? "",
      semester: (item.semester as "" | "harmattan" | "mousson") ?? "",
      academic_year: item.academic_year ?? "",
      course_id: item.course_id?._id ?? "",
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id || !form.institut || !form.semester || form.academic_year === "" || !form.course_id) {
      toast.error("Tous les champs sont requis.");
      return;
    }
    setSaving(true);
    try {
      await admin.createInstructorAssignment({
        user_id: form.user_id,
        institut: form.institut,
        semester: form.semester,
        academic_year: Number(form.academic_year),
        course_id: form.course_id,
      });
      toast.success("Affectation ajoutée.");
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
    if (!form.user_id || !form.institut || !form.semester || form.academic_year === "" || !form.course_id) {
      toast.error("Tous les champs sont requis.");
      return;
    }
    setSaving(true);
    try {
      await admin.updateInstructorAssignment(editing._id, {
        user_id: form.user_id,
        institut: form.institut,
        semester: form.semester,
        academic_year: Number(form.academic_year),
        course_id: form.course_id,
      });
      toast.success("Affectation enregistrée.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignmentToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await admin.deleteInstructorAssignment(assignmentToDelete._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur.");
        return;
      }
      toast.success("Affectation supprimée.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setDeleteLoading(false);
      setAssignmentToDelete(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Affectations formateurs</h1>
      <p className="text-gray-600 mb-6">
        Associez un formateur à un cours pour un institut, un semestre et une année. Lors d’un changement de semestre, ajoutez une nouvelle affectation (même formateur, autre cours si besoin).
      </p>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Institut</label>
          <select
            value={filterInstitut}
            onChange={(e) => setFilterInstitut(e.target.value as "" | "DGI" | "ISSJ" | "ISEG")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
          >
            <option value="">Tous</option>
            {INSTITUTS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
          >
            <option value="">Tous</option>
            {SEMESTRES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
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
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>{y}–{y + 1}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0"
        >
          + Nouvelle affectation
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {(creating || editing) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? "Modifier l'affectation" : "Nouvelle affectation"}</h2>
          <form onSubmit={editing ? handleSaveEdit : handleSaveCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formateur *</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              >
                <option value="">— Choisir —</option>
                {formateurs.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institut *</label>
              <select
                value={form.institut}
                onChange={(e) => setForm((f) => ({ ...f, institut: e.target.value as "" | "DGI" | "ISSJ" | "ISEG" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              >
                <option value="">—</option>
                {INSTITUTS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semestre *</label>
              <select
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value as "" | "harmattan" | "mousson" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              >
                <option value="">—</option>
                {SEMESTRES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année universitaire *</label>
              <select
                value={form.academic_year === "" ? "" : form.academic_year}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value === "" ? "" : parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>{y}–{y + 1}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cours *</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              >
                <option value="">— Choisir (institut + semestre + année ci-dessus) —</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">Aucune affectation. Ajoutez-en une pour lier un formateur à un cours (institut, semestre, année).</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Formateur</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semestre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Année</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cours</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.user_id?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{item.institut}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{item.semester}</td>
                  <td className="px-4 py-3 text-gray-600">{item.academic_year}–{item.academic_year + 1}</td>
                  <td className="px-4 py-3 text-gray-600">{item.course_id?.title ?? "—"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button type="button" onClick={() => openEdit(item)} className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm">Modifier</button>
                    <button type="button" onClick={() => setAssignmentToDelete(item)} className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationBar page={page} total={list.length} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="affectation" />

      <ConfirmDialog
        open={!!assignmentToDelete}
        title="Supprimer l'affectation"
        description={
          assignmentToDelete ? (
            <p>
              Vous êtes sur le point de supprimer l&apos;affectation du formateur{" "}
              <span className="font-semibold">{assignmentToDelete.user_id?.name ?? "—"}</span>{" "}
              au cours <span className="font-semibold">{assignmentToDelete.course_id?.title ?? "—"}</span>.{" "}
              Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            </p>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => !deleteLoading && setAssignmentToDelete(null)}
      />
    </div>
  );
}
