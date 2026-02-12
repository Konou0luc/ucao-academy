"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { courses, admin, filieres, auth } from "@/lib/api";

type CategoryItem = { _id: string; name: string; description?: string };

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publié" },
  { value: "archived", label: "Archivé" },
];

const NIVEAU_OPTIONS = [
  { value: "", label: "—" },
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];
const SEMESTRES = [
  { value: "", label: "—" },
  { value: "harmattan", label: "Harmattan" },
  { value: "mousson", label: "Mousson" },
];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function NouveauCoursAdmin() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    status: "draft",
    filiere: "",
    niveau: "" as "" | "licence1" | "licence2" | "licence3",
    institution: "UCAO-UUT",
    semester: "" as "" | "harmattan" | "mousson",
    academic_year: CURRENT_YEAR as number | "",
    video_url: "",
  });
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);
  const [adminInstitute, setAdminInstitute] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    admin.getCategories().then((list: CategoryItem[]) => setCategories(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);
  useEffect(() => {
    auth.getUser().then((u: { institute?: string | null }) => {
      setAdminInstitute(u?.institute ?? null);
    }).catch(() => setAdminInstitute(null));
  }, []);
  useEffect(() => {
    if (adminInstitute === undefined) return;
    const institute = adminInstitute && adminInstitute !== "" ? adminInstitute : undefined;
    filieres.get(institute).then((list) => setFilieresList(list)).catch(() => setFilieresList([]));
  }, [adminInstitute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.category.trim() || !form.description.trim()) {
      setError("Titre, catégorie et description sont requis.");
      toast.error("Titre, catégorie et description sont requis.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        status: form.status,
        institution: form.institution || "UCAO-UUT",
      };
      if (form.filiere.trim()) payload.filiere = form.filiere.trim();
      if (form.niveau) payload.niveau = form.niveau;
      if (form.semester) payload.semester = form.semester;
      if (form.academic_year !== "" && form.academic_year != null) payload.academic_year = Number(form.academic_year);
      if (form.video_url?.trim()) payload.video_url = form.video_url.trim();
      await courses.create(payload);
      toast.success("Cours créé avec succès.");
      router.push("/admin/formations");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/formations"
          className="flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouveau cours</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Ex. Introduction au Web"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                required
              >
                <option value="">— Choisir une catégorie —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">Aucune catégorie. Ajoutez-en dans <Link href="/admin/categories" className="underline">Catégories</Link>.</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              placeholder="Description du cours..."
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" | "archived" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select
                value={form.niveau}
                onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value as "" | "licence1" | "licence2" | "licence3" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                {NIVEAU_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <select
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value as "" | "harmattan" | "mousson" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                {SEMESTRES.map((s) => (
                  <option key={s.value || "none"} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année universitaire</label>
              <select
                value={form.academic_year === "" ? "" : form.academic_year}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value === "" ? "" : parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>{y}–{y + 1}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={form.filiere}
                onChange={(e) => setForm((f) => ({ ...f, filiere: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {filieresList.map((f) => (
                  <option key={f._id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
              <input
                type="text"
                value={form.institution}
                onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="UCAO-UUT"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL vidéo (optionnel)</label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              placeholder="https://www.youtube.com/watch?v=... ou lien direct vers une vidéo"
            />
            <p className="mt-1 text-sm text-gray-500">YouTube, Vimeo ou lien direct (MP4, etc.).</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              {saving ? "Création..." : "Créer le cours"}
            </button>
            <Link
              href="/admin/formations"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
