"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, PlusCircle, MessageSquare, ArrowRight } from "lucide-react";
import { courses as coursesApi } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";

type CourseItem = { _id: string; title: string; status: string; filiere?: string; niveau?: string };

export default function FormateurDashboardPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi
      .getMine()
      .then((data: CourseItem[] | { message?: string }) => {
        if (Array.isArray(data)) setCourses(data);
        else setCourses([]);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const published = courses.filter((c) => c.status === "published").length;
  const drafts = courses.filter((c) => c.status === "draft").length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Formateur</h1>
        <p className="text-sm text-gray-600 mt-1">Gérez vos cours et suivez l&apos;activité.</p>
      </div>
      <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#03045e]/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#03045e]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-600">Mes cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{published}</p>
              <p className="text-sm text-gray-600">Publiés</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{drafts}</p>
              <p className="text-sm text-gray-600">Brouillons</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Mes cours récents</h2>
          <Link
            href="/formateur/cours/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition"
          >
            <PlusCircle className="w-5 h-5" />
            Créer un cours
          </Link>
        </div>

        {loading ? (
          <LoadingScreen message="Chargement des cours..." withSound={false} className="py-12 rounded-xl" />
        ) : courses.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Vous n&apos;avez pas encore de cours.</p>
            <Link
              href="/formateur/cours/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
            >
              <PlusCircle className="w-5 h-5" />
              Créer mon premier cours
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {courses.slice(0, 8).map((c) => (
              <li key={c._id} className="py-4 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <p className="text-sm text-gray-500">
                      {c.filiere || "—"} · {c.niveau === "licence1" ? "Licence 1" : c.niveau === "licence2" ? "Licence 2" : c.niveau === "licence3" ? "Licence 3" : c.niveau || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        c.status === "published"
                          ? "bg-green-100 text-green-800"
                          : c.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.status === "published" ? "Publié" : c.status === "draft" ? "Brouillon" : "Archivé"}
                    </span>
                    <Link
                      href={`/formateur/cours/${c._id}/edit`}
                      className="p-2 text-[#03045e] hover:bg-[#03045e]/10 rounded-lg transition"
                      title="Modifier"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && courses.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              href="/formateur/cours"
              className="text-[#03045e] font-medium hover:underline"
            >
              Voir tous mes cours →
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
