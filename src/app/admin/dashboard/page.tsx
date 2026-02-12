"use client";
import { useEffect, useState } from "react";
import {
  Users,
  CreditCard,
  TrendingUp,
  BookOpen,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { admin, auth } from "@/lib/api";
import { INSTITUTES } from "@/lib/filieres";

type Stats = {
  totalStudents: number;
  newStudentsThisMonth: number;
  totalFormateurs: number;
  totalFormations: number;
  recentCourses: {
    id?: string;
    _id?: string;
    title: string;
    category?: string;
    created_by?: { name: string; email?: string } | null;
  }[];
  categories: { _id: string; name: string; courseCount: number }[];
};

const insights = [
  { title: "Cours obsolètes", desc: "Mettez à jour vos cours obsolètes pour garder un contenu attractif.", action: "Mettre à jour", href: "/admin/formations" },
  { title: "Formateurs inactifs", desc: "Encouragez les formateurs inactifs à créer du contenu ou à échanger avec les étudiants.", action: "Contacter", href: "/admin/formateurs" },
  { title: "Opportunités de communication", desc: "Contactez les étudiants qui n'ont pas terminé leurs cours pour leur proposer de l'aide.", action: "Voir", href: "/admin/etudiants" },
  { title: "Réalisations récentes", desc: "Célébrez les réalisations et succès récents pour motiver la communauté.", action: "Voir", href: "/admin/formations" },
];

const INSTITUTE_LABEL: Record<string, string> = {
  DGI: "DGI",
  ISSJ: "ISSJ",
  ISEG: "ISEG",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardContext, setDashboardContext] = useState<{ isSuperAdmin: boolean; instituteLabel: string }>({
    isSuperAdmin: true,
    instituteLabel: "",
  });

  useEffect(() => {
    auth
      .getUser()
      .then((u: { role?: string; institute?: string | null }) => {
        const isSuperAdmin = u?.role === "admin" && (u?.institute == null || u?.institute === "");
        const instituteLabel = u?.institute
          ? (INSTITUTES.find((i) => i.value === u.institute)?.label ?? INSTITUTE_LABEL[u.institute] ?? String(u.institute))
          : "";
        setDashboardContext({ isSuperAdmin, instituteLabel });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    admin
      .getStats()
      .then((data: Stats) => setStats(data))
      .catch(() => setError("Impossible de charger les statistiques."))
      .finally(() => setLoading(false));
  }, []);

  const subtitle = dashboardContext.isSuperAdmin
    ? "Vue d'ensemble de la plateforme Web Academy"
    : `Vue d'ensemble de votre institut — ${dashboardContext.instituteLabel}`;

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="p-6 flex items-center justify-center min-h-[40vh]">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4">{error || "Données indisponibles."}</div>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Total étudiants", value: stats.totalStudents.toLocaleString("fr-FR"), icon: Users, color: "bg-[#03045e]/10", iconColor: "text-[#03045e]" },
    { label: "Nouveaux inscrits ce mois", value: stats.newStudentsThisMonth.toLocaleString("fr-FR"), icon: CreditCard, color: "bg-green-500/10", iconColor: "text-green-600" },
    { label: "Revenus ce mois", value: "—", icon: TrendingUp, color: "bg-[#d90429]/10", iconColor: "text-[#d90429]" },
    { label: "Total cours", value: stats.totalFormations.toLocaleString("fr-FR"), icon: BookOpen, color: "bg-blue-500/10", iconColor: "text-blue-600" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      <div className="p-6 space-y-8">
        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${kpi.color} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Derniers cours */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Derniers cours créés</h2>
              <p className="text-xs text-gray-500">
                Un aperçu rapide des formations récemment ajoutées sur Web Academy.
              </p>
            </div>
            <Link
              href="/admin/formations"
              className="text-sm text-[#03045e] hover:text-[#023e8a] font-medium flex items-center gap-1"
            >
              Voir tout
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {stats.recentCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500 text-sm">
              Aucun cours pour le moment. Créez votre première formation depuis l&apos;onglet{" "}
              <span className="font-medium text-[#03045e]">Cours</span>.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentCourses.map((f) => {
                const id = f.id ?? f._id ?? "";
                return (
                  <Link
                    key={id}
                    href={id ? `/admin/formations/${id}/edit` : "/admin/formations"}
                    className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex"
                  >
                    <div className="w-20 flex items-center justify-center bg-[#023e8a] text-white">
                      <BookOpen className="w-8 h-8 opacity-90" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-[#03045e]">
                          {f.title}
                        </h3>
                        {f.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#03045e]/10 text-[#03045e]">
                            {f.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        Par <span className="font-medium">{f.created_by?.name ?? "—"}</span>
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Cliquer pour gérer le cours</span>
                        <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-[#03045e]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Vue d'ensemble des catégories */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d&apos;ensemble des catégories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stats.categories.length === 0 ? (
              <p className="text-gray-600 col-span-full py-4">Aucune catégorie.</p>
            ) : (
              stats.categories.map((cat) => (
                <Link
                  key={cat._id}
                  href="/admin/categories"
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 block p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{cat.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {cat.courseCount} cours
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-10 h-10 rounded-lg bg-[#023e8a] flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] text-gray-500">Gérer</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Conseils & alertes admin */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#03045e]" />
            Conseils & alertes admin
          </h2>
          <div className="space-y-4">
            {insights.map((ins) => (
              <div
                key={ins.title}
                className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div>
                  <div className="font-semibold text-gray-900">{ins.title}</div>
                  <div className="text-gray-600 text-sm mt-1">{ins.desc}</div>
                </div>
                <Link
                  href={ins.href}
                  className="mt-2 md:mt-0 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition text-sm inline-block text-center"
                >
                  {ins.action}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
