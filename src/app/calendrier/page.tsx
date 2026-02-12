"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Calendar, Clock, MapPin, Filter } from "lucide-react";
import { evaluationCalendars as evaluationCalendarsApi, auth, filieres as filieresApi } from "@/lib/api";

type EvaluationItem = {
  id: string;
  title: string;
  description: string;
  filiere: string;
  niveau: string;
  evaluation_date: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string;
  course_title: string;
};

const niveaux = ["Tous", "licence1", "licence2", "licence3"];
const types = ["Tous", "examen", "controle", "tp", "projet"];

export default function CalendrierPage() {
  const [filiereOptions, setFiliereOptions] = useState<string[]>(["Toutes"]);
  const [selectedFiliere, setSelectedFiliere] = useState("Toutes");
  const [selectedNiveau, setSelectedNiveau] = useState("Tous");
  const [selectedType, setSelectedType] = useState("Tous");
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.getUser()
      .then((user: { institute?: string }) => filieresApi.get(user?.institute))
      .catch(() => filieresApi.get())
      .then((list: { name: string }[]) => {
        const names = Array.isArray(list) ? list.map((f) => f.name) : [];
        setFiliereOptions(["Toutes", ...names]);
      })
      .catch(() => setFiliereOptions(["Toutes"]));
  }, []);

  useEffect(() => {
    auth.getUser().then((user: { institute?: string; filiere?: string; niveau?: string }) => {
      const filters: { institut?: string; filiere?: string; niveau?: string } = {};
      if (user?.institute) filters.institut = user.institute;
      if (user?.filiere) filters.filiere = user.filiere;
      if (user?.niveau) filters.niveau = user.niveau;
      return evaluationCalendarsApi.getAll(filters);
    }).catch(() => evaluationCalendarsApi.getAll({}))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setEvaluations(
          list.map((e: { _id: string; title: string; description?: string; filiere?: string; niveau?: string; evaluation_date?: string | Date; start_time?: string; end_time?: string; location?: string; type?: string; course_id?: { title: string } }) => {
            const d = e.evaluation_date;
            const dateStr = typeof d === "string" ? d.slice(0, 10) : d ? new Date(d).toISOString().slice(0, 10) : "";
            return {
              id: String(e._id),
              title: e.title,
              description: e.description || "",
              filiere: e.filiere || "",
              niveau: e.niveau || "",
              evaluation_date: dateStr,
              start_time: e.start_time || "",
              end_time: e.end_time || "",
              location: e.location || "",
              type: e.type || "examen",
              course_title: e.course_id?.title || "",
            };
          })
        );
      })
      .catch(() => {
        setEvaluations([]);
        setError("Impossible de charger le calendrier.");
        toast.error("Impossible de charger le calendrier.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchFiliere = selectedFiliere === "Toutes" || evaluation.filiere === selectedFiliere;
    const matchNiveau = selectedNiveau === "Tous" || evaluation.niveau === selectedNiveau;
    const matchType = selectedType === "Tous" || evaluation.type === selectedType;
    return matchFiliere && matchNiveau && matchType;
  });

  const groupedByDate = filteredEvaluations.reduce((acc, evaluation) => {
    const date = evaluation.evaluation_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(evaluation);
    return acc;
  }, {} as Record<string, EvaluationItem[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "examen":
        return "bg-red-100 text-red-700 border-red-200";
      case "controle":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "tp":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "projet":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des Évaluations</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Consultez les dates et horaires de vos examens, contrôles, TP et projets
            </p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filière
                </label>
                <select
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] bg-white text-gray-900"
                  style={{ color: '#111827' }}
                >
                  {filiereOptions.map((filiere) => (
                    <option key={filiere} value={filiere} style={{ color: '#111827' }}>
                      {filiere}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau
                </label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] bg-white text-gray-900"
                  style={{ color: '#111827' }}
                >
                  {niveaux.map((niveau) => (
                    <option key={niveau} value={niveau} style={{ color: '#111827' }}>
                      {niveau === "Tous" ? "Tous" : niveau === "licence1" ? "Licence 1" : niveau === "licence2" ? "Licence 2" : niveau === "licence3" ? "Licence 3" : niveau}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] bg-white text-gray-900"
                  style={{ color: '#111827' }}
                >
                  {types.map((type) => (
                    <option key={type} value={type} style={{ color: '#111827' }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calendrier */}
          {loading ? (
            <div className="py-12 text-center text-gray-600">Chargement du calendrier...</div>
          ) : sortedDates.length > 0 ? (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-6 h-6 text-[#03045e]" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {new Date(date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {groupedByDate[date].map((evaluation) => (
                      <div
                        key={evaluation.id}
                        className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${getTypeColor(evaluation.type)}`}>
                                {evaluation.type.toUpperCase()}
                              </span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">
                                {evaluation.filiere}
                              </span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                                {evaluation.niveau}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {evaluation.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-2 font-medium">
                              {evaluation.course_title}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {evaluation.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 pt-3 border-t border-gray-200">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {evaluation.start_time} - {evaluation.end_time}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {evaluation.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-600 text-lg">
                Aucune évaluation ne correspond à vos critères.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
