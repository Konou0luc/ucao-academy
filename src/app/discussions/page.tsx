"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { MessageSquare, Search, Filter, Pin, User, Plus, Clock, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";
import { discussions as discussionsApi, courses as coursesApi, auth } from "@/lib/api";

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
    auth.getUser().then((u: { filiere?: string }) => {
      const filters: { filiere?: string } = {};
      if (u?.filiere) filters.filiere = u.filiere;
      return coursesApi.getAll(filters);
    }).then((data) => {
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
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Forum de Discussion</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Échangez avec vos camarades et formateurs</p>
            </div>
            <Link
              href="/discussions/nouveau"
              className="w-full sm:w-auto px-4 py-2.5 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md shrink-0"
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
            <div className="py-12 text-center text-gray-600 dark:text-white">Chargement des discussions...</div>
          ) : (
          <>
          {/* Statistiques rapides */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Total discussions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{discussions.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Réponses totales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {discussions.reduce((sum, d) => sum + d.replies_count, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Discussions actives</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{normalDiscussions.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Pin className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-white" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400 dark:text-white" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les discussions..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filtrer par cours
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Pin className="h-5 w-5 text-yellow-500" />
                Discussions épinglées
              </h3>
              <div className="space-y-4">
                {pinnedDiscussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    onClick={() => router.push(`/discussions/${discussion.id}`)}
                    className="cursor-pointer rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 shadow-sm transition hover:shadow-md group dark:border-gray-600 dark:from-gray-800 dark:to-gray-800 dark:hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${getAvatarColor(discussion.user.name)}`}>
                        {getInitials(discussion.user.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 rounded-md bg-yellow-400 px-2 py-1 text-xs font-semibold text-yellow-900 dark:bg-yellow-500/40 dark:text-yellow-200">
                            <Pin className="h-3 w-3" />
                            Épinglé
                          </span>
                          {discussion.course_title && (
                            <span className="flex items-center gap-1 rounded-md bg-[#03045e] px-2 py-1 text-xs font-medium text-white dark:bg-gray-600 dark:text-white">
                              <BookOpen className="h-3 w-3" />
                              {discussion.course_title}
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 transition group-hover:text-[#03045e] dark:text-white dark:group-hover:text-white">
                          {discussion.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 text-gray-600 dark:text-gray-300">
                          {discussion.content}
                        </p>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-yellow-200 pt-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                          <span className="flex shrink-0 items-center gap-1">
                            <User className="h-4 w-4" />
                            {discussion.user.name}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.replies_count} réponse{discussion.replies_count > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
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
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Toutes les discussions
            </h3>
            {normalDiscussions.length > 0 ? (
              <div className="space-y-4">
                {normalDiscussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    onClick={() => router.push(`/discussions/${discussion.id}`)}
                    className="cursor-pointer rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md group dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${getAvatarColor(discussion.user.name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {getInitials(discussion.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {discussion.course_title && (
                          <span className="mb-2 inline-block rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">
                            {discussion.course_title}
                          </span>
                        )}
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 transition group-hover:text-[#03045e] dark:text-white dark:group-hover:text-white">
                          {discussion.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 text-gray-600 dark:text-gray-300">
                          {discussion.content}
                        </p>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1 shrink-0">
                            <User className="w-4 h-4" />
                            {discussion.user.name}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.replies_count} réponse{discussion.replies_count > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
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
              <div className="rounded-xl border border-gray-100 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="text-lg text-gray-600 dark:text-white">
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
