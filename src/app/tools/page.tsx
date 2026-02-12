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
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Outils</h1>
          <p className="text-sm text-gray-600 mt-1">Liens utiles pour faciliter vos études</p>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-[#03045e] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-lg mx-auto">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#03045e] hover:underline font-medium">
                <LayoutDashboard className="w-4 h-4" /> Retour au tableau de bord
              </Link>
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-lg mx-auto">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucun outil pour le moment</h2>
              <p className="text-gray-600 mb-6">Les liens utiles seront ajoutés par l’administration. Revenez plus tard.</p>
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
                  className="flex flex-col p-5 bg-white border border-gray-200 rounded-xl hover:border-[#03045e]/30 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Wrench className="w-6 h-6 text-[#03045e] flex-shrink-0 mt-0.5" />
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-2">{o.title}</h3>
                  {o.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{o.description}</p>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
