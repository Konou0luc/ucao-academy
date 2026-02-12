"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../../layouts/MainLayout";
import { ArrowLeft, Send, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { discussions as discussionsApi, courses as coursesApi } from "@/lib/api";

export default function NewDiscussionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    course_id: "",
  });
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    coursesApi.getAll().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setCourses(list.map((c: { _id: string; title: string }) => ({ id: String(c._id), title: c.title })));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Le titre est requis");
      toast.error("Le titre est requis");
      return;
    }

    if (!formData.content.trim()) {
      setError("Le contenu est requis");
      toast.error("Le contenu est requis");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Vous devez être connecté pour créer une discussion.");
      toast.error("Vous devez être connecté pour créer une discussion.");
      return;
    }

    setLoading(true);
    try {
      const data = await discussionsApi.create({
        title: formData.title.trim(),
        content: formData.content.trim(),
        course_id: formData.course_id || undefined,
      });
      if (data.message) {
        setError(data.message);
        toast.error(data.message);
        setLoading(false);
        return;
      }
      const id = data._id ? String(data._id) : null;
      toast.success("Discussion créée avec succès.");
      if (id) router.push(`/discussions/${id}`);
      else router.push("/discussions");
    } catch {
      setError("Erreur lors de la création de la discussion. Vérifiez votre connexion.");
      toast.error("Erreur lors de la création de la discussion. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/discussions"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouvelle discussion</h1>
              <p className="text-sm text-gray-600 mt-1">
                Créez une nouvelle discussion pour échanger avec vos camarades
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Cours (optionnel) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Cours (optionnel)
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] bg-white text-gray-900"
                  style={{ color: '#111827' }}
                >
                  <option value="" style={{ color: '#111827' }}>Aucun cours spécifique</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id} style={{ color: '#111827' }}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Titre */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la discussion *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Question sur les bases de données"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                  style={{ color: '#111827' }}
                  required
                />
              </div>

              {/* Contenu */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de la discussion *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Décrivez votre question ou votre sujet de discussion..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] resize-none text-gray-900 placeholder:text-gray-500"
                  style={{ color: "#111827" }}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Soyez clair et précis dans votre question pour obtenir de meilleures réponses.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4">
                <Link
                  href="/discussions"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Publication..." : "Publier la discussion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

