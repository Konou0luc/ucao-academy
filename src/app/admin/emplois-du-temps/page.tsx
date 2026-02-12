"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { timetables as timetablesApi, admin, filieres, auth } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
const INSTITUTS = ["DGI", "ISSJ", "ISEG"] as const;
const NIVEAUX = [
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];
const SEMESTRES = [
  { value: "harmattan", label: "Harmattan" },
  { value: "mousson", label: "Mousson" },
];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];


type TimetableItem = {
  _id: string;
  course_id?: { _id: string; title: string };
  institut?: string | null;
  filiere?: string | null;
  niveau?: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string | null;
  instructor?: string | null;
  semester?: string | null;
  academic_year?: number | null;
};

type CourseOption = { _id: string; id?: string; title: string };
type FormateurOption = { _id: string; name: string; email?: string };

export default function EmploisDuTempsAdmin() {
  const [list, setList] = useState<TimetableItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [formateurs, setFormateurs] = useState<FormateurOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TimetableItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institut: "" as "" | "DGI" | "ISSJ" | "ISEG",
    filiere: "",
    niveau: "" as "" | "licence1" | "licence2" | "licence3",
    course_id: "",
    day_of_week: "lundi" as (typeof JOURS)[number],
    start_time: "08:00",
    end_time: "10:00",
    room: "",
    instructor: "",
    semester: "" as "" | "harmattan" | "mousson",
    academic_year: "" as "" | number,
  });
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);
  const [adminInstitute, setAdminInstitute] = useState<string | null | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [slotToDelete, setSlotToDelete] = useState<TimetableItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    timetablesApi
      .getAll({ limit: PAGE_SIZE, page })
      .then((res: TimetableItem[] | { data: TimetableItem[]; total: number }) => {
        if (Array.isArray(res)) {
          setList(res);
          setTotal(res.length);
        } else {
          setList(res.data || []);
          setTotal(res.total ?? 0);
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur chargement.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const institut = form.institut || undefined;
    const semester = form.semester || undefined;
    const academic_year = form.academic_year !== "" && form.academic_year != null ? form.academic_year : undefined;
    admin.getCourses({ institut, semester, academic_year }).then((data: CourseOption[]) => setCourses(Array.isArray(data) ? data : [])).catch(() => {});
  }, [form.institut, form.semester, form.academic_year]);
  useEffect(() => {
    admin.getUsers({ role: "formateur" }).then((data: FormateurOption[]) => setFormateurs(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);
  useEffect(() => {
    auth.getUser().then((u: { institute?: string | null }) => setAdminInstitute(u?.institute ?? null)).catch(() => setAdminInstitute(null));
  }, []);
  useEffect(() => {
    if (adminInstitute === undefined) return;
    const institute = adminInstitute && adminInstitute !== "" ? adminInstitute : undefined;
    filieres.get(institute).then((list) => setFilieresList(list)).catch(() => setFilieresList([]));
  }, [adminInstitute]);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      institut: "",
      filiere: "",
      niveau: "",
      course_id: courses[0]?._id ?? "",
      day_of_week: "lundi",
      start_time: "08:00",
      end_time: "10:00",
      room: "",
      instructor: "",
      semester: "",
      academic_year: CURRENT_YEAR,
    });
  };

  const openEdit = (item: TimetableItem) => {
    setEditing(item);
    setCreating(false);
    setForm({
      institut: (item.institut as "" | "DGI" | "ISSJ" | "ISEG") ?? "",
      filiere: item.filiere ?? "",
      niveau: (item.niveau as "" | "licence1" | "licence2" | "licence3") ?? "",
      course_id: typeof item.course_id === "object" && item.course_id?._id ? item.course_id._id : "",
      day_of_week: (item.day_of_week as (typeof JOURS)[number]) || "lundi",
      start_time: item.start_time ?? "08:00",
      end_time: item.end_time ?? "10:00",
      room: item.room ?? "",
      instructor: item.instructor ?? "",
      semester: (item.semester as "" | "harmattan" | "mousson") ?? "",
      academic_year: item.academic_year ?? "",
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id?.trim()) {
      toast.error("Choisissez un cours.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        course_id: form.course_id,
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room.trim() || undefined,
        instructor: form.instructor.trim() || undefined,
      };
      if (form.institut) payload.institut = form.institut;
      if (form.filiere.trim()) payload.filiere = form.filiere.trim();
      if (form.niveau) payload.niveau = form.niveau;
      if (form.semester) payload.semester = form.semester;
      if (form.academic_year !== "" && form.academic_year != null) payload.academic_year = Number(form.academic_year);
      await timetablesApi.create(payload);
      toast.success("Créneau ajouté.");
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
    if (!editing || !form.course_id?.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        course_id: form.course_id,
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room.trim() || undefined,
        instructor: form.instructor.trim() || undefined,
      };
      if (form.institut) payload.institut = form.institut;
      else payload.institut = null;
      if (form.filiere.trim()) payload.filiere = form.filiere.trim();
      else payload.filiere = null;
      if (form.niveau) payload.niveau = form.niveau;
      else payload.niveau = null;
      if (form.semester) payload.semester = form.semester;
      else payload.semester = null;
      if (form.academic_year !== "" && form.academic_year != null) payload.academic_year = Number(form.academic_year);
      else payload.academic_year = null;
      await timetablesApi.update(editing._id, payload);
      toast.success("Créneau enregistré.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slotToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await timetablesApi.delete(slotToDelete._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur.");
        return;
      }
      toast.success("Créneau supprimé.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setDeleteLoading(false);
      setSlotToDelete(null);
    }
  };

  const filteredList = searchInput.trim()
    ? list.filter(
        (t) =>
          (t.filiere?.toLowerCase().includes(searchInput.toLowerCase()) ||
            t.niveau?.toLowerCase().includes(searchInput.toLowerCase()) ||
            t.institut?.toLowerCase().includes(searchInput.toLowerCase()) ||
            (t.course_id as { title?: string })?.title?.toLowerCase().includes(searchInput.toLowerCase()))
      )
    : list;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Emplois du temps</h1>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (filière, niveau, institut, cours)</label>
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
          onClick={openCreate}
          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0"
        >
          + Ajouter un créneau
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {(creating || editing) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? "Modifier le créneau" : "Nouveau créneau"}</h2>
          <form onSubmit={editing ? handleSaveEdit : handleSaveCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institut</label>
              <select
                value={form.institut}
                onChange={(e) => {
                  const v = e.target.value as "" | "DGI" | "ISSJ" | "ISEG";
                  setForm((f) => ({ ...f, institut: v, course_id: "" }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {INSTITUTS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cours *</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              >
                <option value="">— Choisir —</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
              <select
                value={form.day_of_week}
                onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value as (typeof JOURS)[number] }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                {JOURS.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure début *</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin *</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={form.filiere}
                onChange={(e) => setForm((f) => ({ ...f, filiere: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {filieresList.map((f) => (
                  <option key={f._id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select
                value={form.niveau}
                onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value as "" | "licence1" | "licence2" | "licence3" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <select
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value as "" | "harmattan" | "mousson" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {SEMESTRES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année universitaire</label>
              <select
                value={form.academic_year === "" ? "" : String(form.academic_year)}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value === "" ? "" : parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>{y}–{y + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                placeholder="Ex. Salle 1.4"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Formateur</label>
              <select
                value={form.instructor}
                onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">— Choisir un formateur —</option>
                {formateurs.map((f) => (
                  <option key={f._id} value={f.name}>{f.name}</option>
                ))}
                {form.instructor && !formateurs.some((f) => f.name === form.instructor) && (
                  <option value={form.instructor}>{form.instructor} (actuel)</option>
                )}
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
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">Aucun créneau.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cours</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Jour</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Horaire</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Filière</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Niveau</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semestre / Année</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Salle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Formateur</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((t) => (
                <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{(t.course_id as { title?: string })?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.day_of_week}</td>
                  <td className="px-4 py-3 text-gray-600">{t.start_time} - {t.end_time}</td>
                  <td className="px-4 py-3 text-gray-600">{t.institut || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.filiere || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.niveau || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {[t.semester, t.academic_year != null ? `${t.academic_year}–${t.academic_year + 1}` : null].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.room || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.instructor || "—"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button type="button" onClick={() => openEdit(t)} className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm">Modifier</button>
                    <button type="button" onClick={() => setSlotToDelete(t)} className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="emploi du temps" />

      <ConfirmDialog
        open={!!slotToDelete}
        title="Supprimer le créneau"
        description={
          slotToDelete ? (
            <p>
              Vous êtes sur le point de supprimer définitivement ce créneau d&apos;emploi du temps
              ({(slotToDelete.course_id as { title?: string })?.title ?? "Cours"} – {slotToDelete.day_of_week} {slotToDelete.start_time}-{slotToDelete.end_time}).<br />
              Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            </p>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => !deleteLoading && setSlotToDelete(null)}
      />
    </div>
  );
}
