"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { MessageSquare, Search, Filter, Pin, User, Plus, Clock, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";
import { discussions as discussionsApi, courses as coursesApi } from "@/lib/api";

const DEBOUNCE_MS = 400;

type DiscussionItem = {
  id: string;
  title: string;
  content: string;
  course_id: string | null;
  course_title: string | null;
  user: { name: string; email?: string };
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-[#03045e]",
    "bg-[#d90429]",
    "bg-blue-600",
    "bg-purple-600",
    "bg-green-600",
    "bg-orange-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const mapDiscussion = (d: { _id: string; title: string; content: string; course_id?: { _id: string; title: string } | null; user_id: { name: string; email?: string }; replies?: unknown[]; is_pinned?: boolean; createdAt?: string }): DiscussionItem => ({
  id: String(d._id),
  title: d.title,
  content: d.content,
  course_id: d.course_id ? String(d.course_id._id) : null,
  course_title: d.course_id?.title ?? null,
  user: d.user_id || { name: "Anonyme" },
  replies_count: Array.isArray(d.replies) ? d.replies.length : 0,
  is_pinned: !!d.is_pinned,
  created_at: d.createdAt || new Date().toISOString(),
});

export default function DiscussionsPage() {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [courseOptions, setCourseOptions] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((courseId: string, searchTerm: string) => {
    setLoading(true);
    discussionsApi
      .getAll({
        courseId: courseId === "all" ? undefined : courseId,
        search: searchTerm || undefined,
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setDiscussions(list.map(mapDiscussion));
      })
      .catch(() => {
        setDiscussions([]);
        setError("Impossible de charger les discussions.");
        toast.error("Impossible de charger les discussions.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load(selectedCourse, search);
  }, [selectedCourse, search, load]);

  useEffect(() => {
    coursesApi.getAll().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setCourseOptions(list.map((c: { _id: string; title: string }) => ({ id: String(c._id), title: c.title })));
    }).catch(() => {});
  }, []);

  const pinnedDiscussions = discussions.filter((d) => d.is_pinned);
  const normalDiscussions = discussions.filter((d) => !d.is_pinned);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forum de Discussion</h1>
              <p className="text-sm text-gray-600 mt-1">Échangez avec vos camarades et formateurs</p>
            </div>
            <Link
              href="/discussions/nouveau"
              className="px-4 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Nouvelle discussion
            </Link>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center text-gray-600">Chargement des discussions...</div>
          ) : (
          <>
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total discussions</p>
                  <p className="text-2xl font-bold text-gray-900">{discussions.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Réponses totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {discussions.reduce((sum, d) => sum + d.replies_count, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Discussions actives</p>
                  <p className="text-2xl font-bold text-gray-900">{normalDiscussions.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Pin className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les discussions..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                    style={{ color: '#111827' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par cours
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] bg-white text-gray-900"
                  style={{ color: '#111827' }}
                >
                  <option value="all" style={{ color: '#111827' }}>Tous les cours</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id} style={{ color: '#111827' }}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Discussions épinglées */}
          {pinnedDiscussions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Pin className="w-5 h-5 text-yellow-500" />
                Discussions épinglées
              </h3>
              <div className="space-y-4">
                {pinnedDiscussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    onClick={() => router.push(`/discussions/${discussion.id}`)}
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm border-2 border-yellow-300 p-6 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${getAvatarColor(discussion.user.name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {getInitials(discussion.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-md font-semibold flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            Épinglé
                          </span>
                          {discussion.course_title && (
                            <span className="px-2 py-1 bg-[#03045e] text-white text-xs rounded-md font-medium flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {discussion.course_title}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#03045e] transition">
                          {discussion.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 mb-3">
                          {discussion.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-yellow-200">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {discussion.user.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.replies_count} réponse{discussion.replies_count > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(discussion.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussions normales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Toutes les discussions
            </h3>
            {normalDiscussions.length > 0 ? (
              <div className="space-y-4">
                {normalDiscussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    onClick={() => router.push(`/discussions/${discussion.id}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${getAvatarColor(discussion.user.name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {getInitials(discussion.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {discussion.course_title && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md mb-2 font-medium">
                            {discussion.course_title}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#03045e] transition">
                          {discussion.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 mb-3">
                          {discussion.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {discussion.user.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.replies_count} réponse{discussion.replies_count > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(discussion.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-lg">
                  Aucune discussion trouvée.
                </p>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
