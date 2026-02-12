"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import MainLayout from "@/app/layouts/MainLayout";
import Link from "next/link";
import {
  BookOpen, Calendar, MessageSquare, FileText,
  Clock, Bell,
  ChevronRight, Users,
} from "lucide-react";
import { courses as coursesApi } from "@/lib/api";
import { discussions as discussionsApi } from "@/lib/api";
import { evaluationCalendars as evaluationCalendarsApi } from "@/lib/api";

type CourseItem = { id: string; title: string; filiere?: string; niveau?: string };
type DiscussionItem = { id: string; title: string; author: string; replies_count: number; created_at: string };
type EventItem = { id: string; title: string; type: string; date: string; time: string; location: string };

const formatNiveau = (n: string | null | undefined) => {
  if (!n) return "—";
  if (n === "licence1") return "Licence 1";
  if (n === "licence2") return "Licence 2";
  if (n === "licence3") return "Licence 3";
  return n;
};

const formatDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "À l'instant";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return formatDate(date);
};

export default function StudentDashboard() {
  const [recentCourses, setRecentCourses] = useState<CourseItem[]>([]);
  const [recentDiscussions, setRecentDiscussions] = useState<DiscussionItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const niveau = typeof window !== "undefined" ? localStorage.getItem("studentLevel") || undefined : undefined;
    const filiere = typeof window !== "undefined" ? localStorage.getItem("studentFiliere") || undefined : undefined;
    const courseFilters = { ...(niveau && { niveau }), ...(filiere && { filiere }) };
    const calendarFilters = { ...(niveau && { niveau }), ...(filiere && { filiere }) };

    Promise.all([
      coursesApi.getAll(courseFilters).then((data) => {
        const list = Array.isArray(data) ? data : [];
        return list.slice(0, 5).map((c: { _id: string; title: string; filiere?: string; niveau?: string }) => ({
          id: String(c._id),
          title: c.title,
          filiere: c.filiere,
          niveau: c.niveau,
        }));
      }),
      discussionsApi.getAll().then((data) => {
        const list = Array.isArray(data) ? data : [];
        return list.slice(0, 5).map((d: { _id: string; title: string; user_id?: { name: string }; replies?: unknown[]; createdAt?: string }) => ({
          id: String(d._id),
          title: d.title,
          author: d.user_id?.name ?? "Anonyme",
          replies_count: Array.isArray(d.replies) ? d.replies.length : 0,
          created_at: d.createdAt ?? "",
        }));
      }),
      evaluationCalendarsApi.getAll(calendarFilters).then((data) => {
        const list = Array.isArray(data) ? data : [];
        const now = new Date();
        return list
          .filter((e: { evaluation_date?: string | Date }) => {
            const d = e.evaluation_date ? new Date(e.evaluation_date) : null;
            return d && d >= now;
          })
          .sort((a: { evaluation_date?: string }, b: { evaluation_date?: string }) =>
            new Date(a.evaluation_date || 0).getTime() - new Date(b.evaluation_date || 0).getTime()
          )
          .slice(0, 5)
          .map((e: { _id: string; title: string; type?: string; evaluation_date?: string; start_time?: string; location?: string }) => ({
            id: String(e._id),
            title: e.title,
            type: e.type || "examen",
            date: formatDate(e.evaluation_date || ""),
            time: e.start_time || "—",
            location: e.location || "—",
          }));
      }),
    ])
      .then(([courses, discussions, events]) => {
        setRecentCourses(courses);
        setRecentDiscussions(discussions);
        setUpcomingEvents(events);
      })
      .catch(() => {
        setError("Impossible de charger les données.");
        toast.error("Impossible de charger les données.");
      })
      .finally(() => setLoading(false));
  }, []);

  const examCount = upcomingEvents.filter((e) => e.type === "examen").length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Tableau de bord</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Bienvenue sur votre espace étudiant</p>
            </div>
            <button className="relative shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" type="button" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Mes Cours</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{recentCourses.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#03045e]/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#03045e]" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Discussions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{recentDiscussions.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Événements à venir</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{upcomingEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Examens à venir</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{examCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-100 p-6 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Cours</h2>
                    <Link href="/cours" className="text-sm text-[#03045e] hover:text-[#023e8a] font-medium flex items-center gap-1">
                      Voir tout
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {recentCourses.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun cours pour votre niveau.</p>
                  ) : (
                    recentCourses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/cours/${course.id}`}
                        className="block p-4 rounded-lg border border-gray-100 hover:border-[#03045e]/30 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-[#03045e] transition mb-1">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>{course.filiere || "—"}</span>
                              <span>•</span>
                              <span>{formatNiveau(course.niveau)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#03045e] transition" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Discussions récentes</h2>
                    <Link href="/discussions" className="text-sm text-[#03045e] hover:text-[#023e8a] font-medium flex items-center gap-1">
                      Voir tout
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {recentDiscussions.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucune discussion.</p>
                  ) : (
                    recentDiscussions.map((discussion) => (
                      <Link
                        key={discussion.id}
                        href={`/discussions/${discussion.id}`}
                        className="block p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                      >
                        <h3 className="font-medium text-gray-900 group-hover:text-[#03045e] transition mb-2">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {discussion.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.replies_count} réponses
                          </span>
                          <span>{formatRelativeTime(discussion.created_at)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Événements à venir</h2>
                </div>
                <div className="p-6 space-y-4">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun événement à venir.</p>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              event.type === "examen" ? "bg-red-100" : event.type === "controle" ? "bg-orange-100" : "bg-blue-100"
                            }`}
                          >
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm mb-1">{event.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>{event.date}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{event.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Link href="/calendrier" className="block text-center text-sm text-[#03045e] hover:text-[#023e8a] font-medium py-2">
                    Voir le calendrier complet
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
                </div>
                <div className="p-6 space-y-2">
                  <Link href="/cours" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-gray-700 hover:text-[#03045e]">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Parcourir les cours</span>
                  </Link>
                  <Link href="/discussions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-gray-700 hover:text-[#03045e]">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">Rejoindre une discussion</span>
                  </Link>
                  <Link href="/emploi-du-temps" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-gray-700 hover:text-[#03045e]">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Voir mon emploi du temps</span>
                  </Link>
                  <Link href="/results" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-gray-700 hover:text-[#03045e]">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Consulter mes résultats</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
