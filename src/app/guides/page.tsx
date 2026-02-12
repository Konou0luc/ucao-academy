"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../layouts/MainLayout";
import { BookOpen, ChevronRight, Loader2, LayoutDashboard } from "lucide-react";
import { guides as guidesApi } from "@/lib/api";

type GuideItem = { _id: string; title: string; content?: string; status?: string };

export default function GuidesPage() {
  const [list, setList] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    guidesApi
      .getAll()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setError("Impossible de charger les guides."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guides</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Consultez les guides pour vous aider dans vos études</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-[#03045e] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-lg mx-auto">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#03045e] hover:underline font-medium">
                <LayoutDashboard className="w-4 h-4" /> Retour au tableau de bord
              </Link>
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-lg mx-auto">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucun guide pour le moment</h2>
              <p className="text-gray-600 mb-6">Les guides seront ajoutés par l’administration. Revenez plus tard.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition">
                <LayoutDashboard className="w-4 h-4" /> Tableau de bord
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((g) => (
                <li key={g._id}>
                  <Link
                    href={`/guides/${g._id}`}
                    className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#03045e]/30 hover:shadow-sm transition"
                  >
                    <span className="font-medium text-gray-900">{g.title}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
