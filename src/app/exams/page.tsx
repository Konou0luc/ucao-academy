"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Clock, MapPin } from "lucide-react";
import { evaluationCalendars as evaluationCalendarsApi, auth } from "@/lib/api";

type ExamItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: "À venir" | "Terminé";
  type: string;
};

const typeLabel: Record<string, string> = {
  examen: "Examen",
  controle: "Contrôle",
  tp: "TP",
  projet: "Projet",
};

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "À venir" | "Terminé">("all");

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
        const now = new Date();
        setExams(
          list.map((e: { _id: string; title: string; type?: string; evaluation_date?: string; start_time?: string; end_time?: string; location?: string }) => {
            const d = e.evaluation_date ? new Date(e.evaluation_date) : null;
            const isPast = d ? d < now : false;
            const timeStr = e.end_time ? `${e.start_time || "—"} - ${e.end_time}` : (e.start_time || "—");
            return {
              id: String(e._id),
              title: e.title,
              date: d ? d.toISOString().slice(0, 10) : "",
              time: timeStr,
              location: e.location || "—",
              status: isPast ? "Terminé" : "À venir",
              type: typeLabel[e.type || "examen"] || e.type || "Examen",
            };
          })
        );
      })
      .catch(() => {
        setError("Impossible de charger les examens.");
        toast.error("Impossible de charger les examens.");
        setExams([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredExams = filter === "all" ? exams : exams.filter((exam) => exam.status === filter);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examens</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Consultez vos examens et évaluations à venir</p>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "À venir" | "Terminé")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="À venir">À venir</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20">
              {error}
            </div>
          )}
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          ) : filteredExams.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-300">Aucun examen ou évaluation pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="rounded-xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">
                          {exam.type}
                        </span>
                        <span
                          className={`rounded px-3 py-1 text-xs font-semibold ${
                            exam.status === "À venir" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{exam.title}</h3>
                      <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-3">
                        <div>
                          <span className="font-semibold">Date :</span>{" "}
                          {exam.date ? new Date(exam.date).toLocaleDateString("fr-FR") : "—"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">Heure :</span> {exam.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="font-semibold">Lieu :</span> {exam.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
