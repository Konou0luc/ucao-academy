"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { courses as coursesApi, filieres, auth } from "@/lib/api";

const CATEGORIES = ["Informatique", "Réseaux", "Base de données", "Gestion", "Droit", "Autre"];
const NIVEAUX = [
  { value: "", label: "—" },
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];

export default function NouveauCoursPage() {
  const router = useRouter();
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
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);
  const [userInstitute, setUserInstitute] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    auth.getUser().then((u: { institute?: string | null }) => setUserInstitute(u?.institute ?? null)).catch(() => setUserInstitute(null));
  }, []);
  useEffect(() => {
    if (userInstitute === undefined) return;
    const institute = userInstitute && userInstitute !== "" ? userInstitute : undefined;
    filieres.get(institute).then((list) => setFilieresList(list)).catch(() => setFilieresList([]));
  }, [userInstitute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const data = await coursesApi.create({
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
      const id = (data as { _id?: string })._id;
      toast.success("Cours créé avec succès.");
      router.push(id ? `/formateur/cours/${id}/edit` : "/formateur/cours");
    } catch {
      toast.error("Erreur lors de la création du cours.");
    }
    setSaving(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/formateur/cours" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau cours</h1>
            <p className="text-sm text-gray-600 mt-1">Renseignez les informations du cours.</p>
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
            {saving ? "Création..." : "Créer le cours"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
