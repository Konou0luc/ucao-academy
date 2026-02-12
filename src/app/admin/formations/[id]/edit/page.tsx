"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { courses, admin, filieres, auth } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://ucao-backend.vercel.app/api").replace(/\/api\/?$/, "");

type ResourceItem = { _id: string; name: string; type: string; url: string };

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

type CourseData = {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  description: string;
  status: string;
  filiere?: string | null;
  niveau?: string | null;
  institution?: string | null;
  semester?: string | null;
  academic_year?: number | null;
  video_url?: string | null;
};

export default function EditCoursAdmin() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    status: "draft",
    filiere: "",
    niveau: "" as "" | "licence1" | "licence2" | "licence3",
    institution: "UCAO-UUT",
    semester: "" as "" | "harmattan" | "mousson",
    academic_year: "" as number | "",
    video_url: "",
  });
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);
  const [adminInstitute, setAdminInstitute] = useState<string | null | undefined>(undefined);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setError("");
    courses
      .getOne(id)
      .then((data: CourseData & { resources?: ResourceItem[] }) => {
        setForm({
          title: data.title ?? "",
          category: data.category ?? "",
          description: data.description ?? "",
          status: data.status ?? "draft",
          filiere: data.filiere ?? "",
          niveau: (data.niveau as "" | "licence1" | "licence2" | "licence3") ?? "",
          institution: data.institution ?? "UCAO-UUT",
          semester: (data.semester as "" | "harmattan" | "mousson") ?? "",
          academic_year: data.academic_year ?? "",
          video_url: data.video_url ?? "",
        });
        setResources(data.resources ?? []);
      })
      .catch(() => {
        setNotFound(true);
        toast.error("Cours introuvable.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
      else payload.filiere = null;
      if (form.niveau) payload.niveau = form.niveau;
      else payload.niveau = null;
      if (form.semester) payload.semester = form.semester;
      else payload.semester = null;
      if (form.academic_year !== "" && form.academic_year != null) payload.academic_year = Number(form.academic_year);
      else payload.academic_year = null;
      payload.video_url = form.video_url?.trim() || null;
      await courses.update(id, payload);
      toast.success("Cours enregistré.");
      router.push("/admin/formations");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const data = await courses.uploadResource(id, file);
      if ((data as { message?: string }).message) {
        toast.error((data as { message: string }).message);
      } else {
        setResources((prev) => [...prev, data as ResourceItem]);
        toast.success("Fichier ajouté.");
      }
    } catch {
      toast.error("Erreur lors de l'upload.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!id || !confirm("Supprimer cette ressource ?")) return;
    try {
      const res = await courses.deleteResource(id, resourceId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
        return;
      }
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
      toast.success("Ressource supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href="/admin/formations"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">
          Chargement...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href="/admin/formations"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux cours
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600 mb-4">Cours introuvable.</p>
          <Link
            href="/admin/formations"
            className="text-[#03045e] font-medium hover:underline"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier le cours</h1>
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
                {form.category && !categories.some((c) => c.name === form.category) && (
                  <option value={form.category}>{form.category} (actuelle)</option>
                )}
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
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
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
                {form.filiere && !filieresList.some((x) => x.name === form.filiere) && (
                  <option value={form.filiere}>{form.filiere} (actuelle)</option>
                )}
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
              placeholder="https://www.youtube.com/watch?v=... ou lien direct"
            />
            <p className="mt-1 text-sm text-gray-500">YouTube, Vimeo ou lien direct (MP4). Visible par les étudiants sur la page du cours.</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ressources du cours</label>
            <p className="text-sm text-gray-500 mb-3">
              Fichiers et images que les étudiants pourront consulter (PDF, images, Word, Excel, ZIP — taille max dans Paramètres).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              {uploading ? "Envoi..." : "Ajouter un fichier ou une image"}
            </button>
            {resources.length > 0 && (
              <ul className="mt-4 space-y-2">
                {resources.map((r) => (
                  <li
                    key={r._id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {r.type === "image" ? (
                      <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-200 flex-shrink-0">
                        <Image
                          src={`${API_BASE}${r.url}`}
                          alt={r.name}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <FileText className="w-10 h-10 text-gray-400 flex-shrink-0" />
                    )}
                    <a
                      href={`${API_BASE}${r.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-sm font-medium text-[#03045e] hover:underline truncate"
                    >
                      {r.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteResource(r._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
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
