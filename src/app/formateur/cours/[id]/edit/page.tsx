"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Trash2 } from "lucide-react";
import { courses as coursesApi, filieres, auth } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://ucao-backend.vercel.app/api").replace(/\/api\/?$/, "");

type ResourceItem = { _id: string; name: string; type: string; url: string };

const CATEGORIES = ["Informatique", "Réseaux", "Base de données", "Gestion", "Droit", "Autre"];
const NIVEAUX = [
  { value: "", label: "—" },
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];

export default function EditCoursPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    filiere: "",
    niveau: "",
    description: "",
    status: "draft",
    thumbnail: "",
    video_url: "",
  });
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);
  const [userInstitute, setUserInstitute] = useState<string | null | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    auth.getUser().then((u: { institute?: string | null }) => setUserInstitute(u?.institute ?? null)).catch(() => setUserInstitute(null));
  }, []);
  useEffect(() => {
    if (userInstitute === undefined) return;
    const institute = userInstitute && userInstitute !== "" ? userInstitute : undefined;
    filieres.get(institute).then((list) => setFilieresList(list)).catch(() => setFilieresList([]));
  }, [userInstitute]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    coursesApi
      .getOne(id)
      .then((data: Record<string, unknown> & { message?: string }) => {
        if (data.message) {
          toast.error(data.message);
          router.push("/formateur/cours");
          return;
        }
        setForm({
          title: (data.title as string) ?? "",
          category: (data.category as string) ?? CATEGORIES[0],
          filiere: (data.filiere as string) ?? "",
          niveau: (data.niveau as string) ?? "",
          description: (data.description as string) ?? "",
          status: (data.status as string) ?? "draft",
          thumbnail: (data.thumbnail as string) ?? "",
          video_url: (data.video_url as string) ?? "",
        });
        setResources((data.resources as ResourceItem[]) ?? []);
      })
      .catch(() => {
        toast.error("Cours introuvable.");
        router.push("/formateur/cours");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La description est requise.");
      return;
    }
    setSaving(true);
    try {
      const data = await coursesApi.update(id, {
        title: form.title.trim(),
        category: form.category,
        filiere: form.filiere || undefined,
        niveau: form.niveau || undefined,
        description: form.description.trim(),
        status: form.status,
        thumbnail: form.thumbnail || undefined,
        video_url: form.video_url || undefined,
      });
      if ((data as { message?: string }).message) {
        toast.error((data as { message: string }).message);
        setSaving(false);
        return;
      }
      toast.success("Cours enregistré.");
      setTimeout(() => router.push("/formateur/cours"), 400);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setSaving(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const data = await coursesApi.uploadResource(id, file);
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
      const res = await coursesApi.deleteResource(id, resourceId);
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r._id !== resourceId));
        toast.success("Ressource supprimée.");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur.");
      }
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <LoadingScreen message="Chargement du cours..." withSound={false} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/formateur/cours" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier le cours</h1>
            <p className="text-sm text-gray-600 mt-1">Mettez à jour les informations du cours.</p>
          </div>
        </div>
      </div>
      <div className="p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
            placeholder="Ex: Introduction à l'Informatique"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filière</label>
            <select
              value={form.filiere}
              onChange={(e) => setForm({ ...form, filiere: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
            <select
              value={form.niveau}
              onChange={(e) => setForm({ ...form, niveau: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
            >
              {NIVEAUX.map((n) => (
                <option key={n.value || "x"} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 resize-none"
            placeholder="Décrivez le contenu et les objectifs du cours..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">URL vidéo (optionnel)</label>
          <input
            type="url"
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
            placeholder="https://..."
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#03045e]" />
            Ressources pour les étudiants
          </h3>
          <p className="text-sm text-gray-600 mb-4">
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

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/formateur/cours"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
