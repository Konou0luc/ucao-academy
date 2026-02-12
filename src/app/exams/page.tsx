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
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examens</h1>
              <p className="text-sm text-gray-600 mt-1">Consultez vos examens et évaluations à venir</p>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "À venir" | "Terminé")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] bg-white text-gray-900"
              style={{ color: "#111827" }}
            >
              <option value="all" style={{ color: "#111827" }}>Tous</option>
              <option value="À venir" style={{ color: "#111827" }}>À venir</option>
              <option value="Terminé" style={{ color: "#111827" }}>Terminé</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <p className="text-gray-600">Chargement...</p>
          ) : filteredExams.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
              <p className="text-gray-600">Aucun examen ou évaluation pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {exam.type}
                        </span>
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            exam.status === "À venir" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{exam.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
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
