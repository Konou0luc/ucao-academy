"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../layouts/MainLayout";
import { Wrench, ExternalLink, Loader2, LayoutDashboard } from "lucide-react";
import { outils as outilsApi } from "@/lib/api";

type OutilItem = { _id: string; title: string; description?: string; url: string };

export default function ToolsPage() {
  const [list, setList] = useState<OutilItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    outilsApi
      .getAll()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setError("Impossible de charger les outils."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Outils</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Liens utiles pour faciliter vos études</p>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-[#03045e] animate-spin" />
            </div>
          ) : error ? (
            <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Wrench className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-medium text-[#03045e] hover:underline dark:text-blue-300">
                <LayoutDashboard className="h-4 w-4" /> Retour au tableau de bord
              </Link>
            </div>
          ) : list.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Wrench className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucun outil pour le moment</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">Les liens utiles seront ajoutés par l’administration. Revenez plus tard.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition">
                <LayoutDashboard className="w-4 h-4" /> Tableau de bord
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((o) => (
                <a
                  key={o._id}
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition hover:border-[#03045e]/30 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#03045e]/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Wrench className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#03045e] dark:text-blue-400" />
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">{o.title}</h3>
                  {o.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{o.description}</p>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
