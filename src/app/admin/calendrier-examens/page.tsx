"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { evaluationCalendars as calendarsApi, admin, filieres, auth } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

const INSTITUTS = ["DGI", "ISSJ", "ISEG"] as const;
const NIVEAUX = [
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];
const TYPES = [
  { value: "examen", label: "Examen" },
  { value: "controle", label: "Contrôle" },
  { value: "tp", label: "TP" },
  { value: "projet", label: "Projet" },
];
const SEMESTRES = [
  { value: "harmattan", label: "Harmattan" },
  { value: "mousson", label: "Mousson" },
];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

type CalendarItem = {
  _id: string;
  title: string;
  description?: string | null;
  institut?: string | null;
  filiere?: string | null;
  niveau?: string | null;
  evaluation_date: string | Date;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  type: string;
  course_id?: { _id: string; title: string } | null;
  semester?: string | null;
  academic_year?: number | null;
};

type CourseOption = { _id: string; id?: string; title: string };

export default function CalendrierExamensAdmin() {
  const [list, setList] = useState<CalendarItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CalendarItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    institut: "" as "" | "DGI" | "ISSJ" | "ISEG",
    filiere: "",
    niveau: "" as "" | "licence1" | "licence2" | "licence3",
    evaluation_date: "",
    start_time: "08:00",
    end_time: "10:00",
    location: "",
    type: "examen" as "examen" | "controle" | "tp" | "projet",
    course_id: "",
    semester: "" as "" | "harmattan" | "mousson",
    academic_year: "" as "" | number,
  });
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);
  const [adminInstitute, setAdminInstitute] = useState<string | null | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [eventToDelete, setEventToDelete] = useState<CalendarItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    calendarsApi
      .getAll({ limit: PAGE_SIZE, page })
      .then((res: CalendarItem[] | { data: CalendarItem[]; total: number }) => {
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
    auth.getUser().then((u: { institute?: string | null }) => setAdminInstitute(u?.institute ?? null)).catch(() => setAdminInstitute(null));
  }, []);
  useEffect(() => {
    if (adminInstitute === undefined) return;
    const institute = adminInstitute && adminInstitute !== "" ? adminInstitute : undefined;
    filieres.get(institute).then((list) => setFilieresList(list)).catch(() => setFilieresList([]));
  }, [adminInstitute]);

  // Charger les cours (filtrés par institut, semestre et année du formulaire)
  useEffect(() => {
    const institut = form.institut || undefined;
    const semester = form.semester || undefined;
    const academic_year = form.academic_year !== "" && form.academic_year != null ? form.academic_year : undefined;
    admin.getCourses({ institut, semester, academic_year }).then((data: CourseOption[]) => setCourses(Array.isArray(data) ? data : [])).catch(() => {});
  }, [form.institut, form.semester, form.academic_year]);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      title: "",
      description: "",
      institut: "",
      filiere: "",
      niveau: "",
      evaluation_date: today,
      start_time: "08:00",
      end_time: "10:00",
      location: "",
      type: "examen",
      course_id: "",
      semester: "",
      academic_year: CURRENT_YEAR,
    });
  };

  const openEdit = (item: CalendarItem) => {
    setEditing(item);
    setCreating(false);
    const d = item.evaluation_date ? new Date(item.evaluation_date) : new Date();
    const dateStr = d.toISOString().slice(0, 10);
    setForm({
      title: item.title,
      description: item.description ?? "",
      institut: (item.institut as "" | "DGI" | "ISSJ" | "ISEG") ?? "",
      filiere: item.filiere ?? "",
      niveau: (item.niveau as "" | "licence1" | "licence2" | "licence3") ?? "",
      evaluation_date: dateStr,
      start_time: item.start_time ?? "08:00",
      end_time: item.end_time ?? "10:00",
      location: item.location ?? "",
      type: (item.type as "examen" | "controle" | "tp" | "projet") || "examen",
      course_id: item.course_id?._id ?? "",
      semester: (item.semester as "" | "harmattan" | "mousson") ?? "",
      academic_year: item.academic_year ?? "",
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.evaluation_date) {
      toast.error("Titre et date requis.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        evaluation_date: new Date(form.evaluation_date),
        type: form.type,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.institut) payload.institut = form.institut;
      if (form.filiere.trim()) payload.filiere = form.filiere.trim();
      if (form.niveau) payload.niveau = form.niveau;
      if (form.start_time) payload.start_time = form.start_time;
      if (form.end_time) payload.end_time = form.end_time;
      if (form.location.trim()) payload.location = form.location.trim();
      if (form.course_id?.trim()) payload.course_id = form.course_id;
      if (form.semester) payload.semester = form.semester;
      if (form.academic_year !== "" && form.academic_year != null) payload.academic_year = Number(form.academic_year);
      await calendarsApi.create(payload);
      toast.success("Événement ajouté.");
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
    if (!editing || !form.title.trim() || !form.evaluation_date) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        evaluation_date: new Date(form.evaluation_date),
        type: form.type,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      else payload.description = null;
      if (form.institut) payload.institut = form.institut;
      else payload.institut = null;
      if (form.filiere.trim()) payload.filiere = form.filiere.trim();
      else payload.filiere = null;
      if (form.niveau) payload.niveau = form.niveau;
      else payload.niveau = null;
      if (form.start_time) payload.start_time = form.start_time;
      if (form.end_time) payload.end_time = form.end_time;
      if (form.location.trim()) payload.location = form.location.trim();
      else payload.location = null;
      if (form.course_id?.trim()) payload.course_id = form.course_id;
      else payload.course_id = null;
      if (form.semester) payload.semester = form.semester;
      else payload.semester = null;
      if (form.academic_year !== "" && form.academic_year != null) payload.academic_year = Number(form.academic_year);
      else payload.academic_year = null;
      await calendarsApi.update(editing._id, payload);
      toast.success("Événement enregistré.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await calendarsApi.delete(eventToDelete._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur.");
        return;
      }
      toast.success("Événement supprimé.");
      setEditing(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setDeleteLoading(false);
      setEventToDelete(null);
    }
  };

  const filteredList = searchInput.trim()
    ? list.filter(
        (t) =>
          t.title?.toLowerCase().includes(searchInput.toLowerCase()) ||
          t.filiere?.toLowerCase().includes(searchInput.toLowerCase()) ||
          t.niveau?.toLowerCase().includes(searchInput.toLowerCase()) ||
          t.institut?.toLowerCase().includes(searchInput.toLowerCase())
      )
    : list;

  const formatDate = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendrier d&apos;examens</h1>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (titre, filière, niveau, institut)</label>
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
          + Ajouter un événement
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 font-semibold">{error}</div>}

      {(creating || editing) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? "Modifier l'événement" : "Nouvel événement (examen, contrôle, TP, projet)"}</h2>
          <form onSubmit={editing ? handleSaveEdit : handleSaveCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                placeholder="Ex. Examen Final - Génie Logiciel"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.evaluation_date}
                onChange={(e) => setForm((f) => ({ ...f, evaluation_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "examen" | "controle" | "tp" | "projet" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Salle</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                placeholder="Ex. Salle 1.4"
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Cours (optionnel)</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] text-gray-900"
                placeholder="Optionnel"
              />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">Aucun événement.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Horaire</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut / Filière / Niveau</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semestre / Année</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Lieu</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredList
                .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
                .map((item) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(item.evaluation_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === "examen" ? "bg-red-100 text-red-800" :
                        item.type === "controle" ? "bg-amber-100 text-amber-800" :
                        item.type === "tp" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{[item.institut, item.filiere, item.niveau].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[item.semester, item.academic_year != null ? `${item.academic_year}–${item.academic_year + 1}` : null].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.location || "—"}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm">Modifier</button>
                      <button type="button" onClick={() => setEventToDelete(item)} className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm">Supprimer</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="événement" />

      <ConfirmDialog
        open={!!eventToDelete}
        title="Supprimer l'événement"
        description={
          eventToDelete ? (
            <p>
              Vous êtes sur le point de supprimer définitivement l&apos;événement{" "}
              <span className="font-semibold">{eventToDelete.title}</span>.{" "}
              Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            </p>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => !deleteLoading && setEventToDelete(null)}
      />
    </div>
  );
}
