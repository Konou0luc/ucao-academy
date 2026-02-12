"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Calendar, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { timetables as timetablesApi, auth } from "@/lib/api";

type TimetableItem = {
  id: string;
  course_title: string;
  class_code: string;
  filiere: string;
  niveau: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  type: string;
};

const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Grille 07:00–18:00 par pas de 30 min (comme un vrai emploi du temps)
const GRID_START_MINUTES = 7 * 60;   // 07:00
const GRID_END_MINUTES = 18 * 60;    // 18:00
const GRID_TOTAL_MINUTES = GRID_END_MINUTES - GRID_START_MINUTES;

const heures: string[] = [];
for (let h = 7; h <= 18; h++) {
  heures.push(`${h.toString().padStart(2, "0")}:00`);
  if (h < 18) heures.push(`${h.toString().padStart(2, "0")}:30`);
}

/** "09:45" ou "9:45" → minutes depuis minuit */
function timeToMinutes(time: string): number {
  const parts = (time || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!parts) return NaN;
  const h = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return NaN;
  return h * 60 + m;
}

export default function EmploiDuTempsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = (filters: { institut?: string; filiere?: string; niveau?: string }) => {
      timetablesApi
        .getAll(filters)
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setTimetable(
            list.map((t: { _id: string; course_id?: { title: string }; filiere?: string; niveau?: string; day_of_week?: string; start_time?: string; end_time?: string; room?: string; instructor?: string }) => ({
              id: String(t._id),
              course_title: t.course_id?.title || "",
              class_code: t.course_id?.title?.slice(0, 4) || "-",
              filiere: t.filiere || "",
              niveau: t.niveau || "",
              day_of_week: t.day_of_week || "lundi",
              start_time: t.start_time || "",
              end_time: t.end_time || "",
              room: t.room || "",
              instructor: t.instructor || "",
              type: "Cours",
            }))
          );
        })
        .catch(() => {
          setTimetable([]);
          setError("Impossible de charger l'emploi du temps.");
          toast.error("Impossible de charger l'emploi du temps.");
        })
        .finally(() => setLoading(false));
    };

    auth.getUser().then((user: { institute?: string; filiere?: string; niveau?: string }) => {
      const filters: { institut?: string; filiere?: string; niveau?: string } = {};
      if (user?.institute) filters.institut = user.institute;
      if (user?.filiere) filters.filiere = user.filiere;
      if (user?.niveau) filters.niveau = user.niveau;
      load(filters);
    }).catch(() => load({}));
  }, []);

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const dates = [];
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      dates.push(currentDate);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);
  const filteredTimetable = timetable;

  const getEventPosition = (startTime: string, endTime: string) => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (Number.isNaN(startMin) || Number.isNaN(endMin) || endMin <= startMin) return null;
    const top = Math.max(0, (startMin - GRID_START_MINUTES) / GRID_TOTAL_MINUTES) * 100;
    const endPct = Math.min(100, (endMin - GRID_START_MINUTES) / GRID_TOTAL_MINUTES * 100);
    const height = Math.max(2, endPct - top);
    return { top: `${top}%`, height: `${height}%` };
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "SOUTENANCE":
        return "bg-yellow-400 border-yellow-500";
      case "Cours":
        return "bg-[#1e40af] border-[#1e3a8a]";
      case "TP":
        return "bg-green-500 border-green-600";
      case "Examen":
        return "bg-red-500 border-red-600";
      default:
        return "bg-gray-500 border-gray-600";
    }
  };

  const navigateWeek = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(currentWeek);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (direction === "next") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setTime(Date.now());
    }
    setCurrentWeek(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-transparent">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white sm:gap-3 sm:text-2xl">
                <Calendar className="h-5 w-5 shrink-0 text-gray-700 dark:text-white sm:h-6 sm:w-6" />
                Planning
              </h1>
              <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {currentWeek.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-200 transition shrink-0" title="Informations">
                <Info className="w-4 h-4 text-pink-600" />
              </div>
              <div className="flex items-center gap-0 overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 sm:gap-1">
                <button
                  onClick={() => navigateWeek("prev")}
                  className="p-2 text-gray-600 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 sm:px-3 sm:py-2"
                  aria-label="Semaine précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigateWeek("today")}
                  className="border-x border-gray-300 px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 sm:px-4 sm:text-base"
                >
                  Aujourd&apos;hui
                </button>
                <button
                  onClick={() => navigateWeek("next")}
                  className="p-2 text-gray-600 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 sm:px-3 sm:py-2"
                  aria-label="Semaine suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-4 mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 sm:mx-6 lg:mx-8">
            {error}
          </div>
        )}
{loading ? (
            <div className="flex flex-1 items-center justify-center text-gray-600 dark:text-white">
              Chargement de l&apos;emploi du temps...
            </div>
        ) : (
          <>
            {/* Calendar Grid - min-width pour que les colonnes jour restent larges sur mobile */}
            <div className="flex-1 overflow-auto">
          <div className="min-w-[900px]">
            {/* Days Header */}
            <div className="sticky top-0 z-10 grid grid-cols-7 border-b-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
              <div className="border-r border-gray-300 p-3 dark:border-gray-600">
                <div className="text-xs font-medium uppercase text-gray-600 dark:text-gray-400">Heure</div>
              </div>
              {weekDates.map((date, index) => (
                <div
                  key={index}
                  className={`border-r border-gray-300 p-3 text-center dark:border-gray-600 ${
                    isToday(date) ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                >
                  <div className="mb-1 text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                    {jours[index].slice(0, 3)}
                  </div>
                  <div className={`text-base font-bold ${isToday(date) ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                    {date.getDate().toString().padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-7">
              {/* Time Column */}
              <div className="border-r-2 border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-800/50">
                {heures.map((heure, index) => (
                  <div
                    key={index}
                    className="flex h-12 items-start justify-end border-b border-gray-200 pr-3 pt-1 dark:border-gray-700"
                  >
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {index % 2 === 0 ? heure : ""}
                    </span>
                  </div>
                ))}
              </div>

              {/* Days Columns */}
              {weekDates.map((date, dayIndex) => {
                const dayName = jours[dayIndex];
                const dayEvents = filteredTimetable.filter(
                  (item) => item.day_of_week === dayName
                );

                return (
                  <div
                    key={dayIndex}
                    className={`relative border-r-2 border-gray-300 dark:border-gray-600 ${
                      isToday(date) ? "bg-blue-50/20 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    {heures.map((_, hourIndex) => (
                      <div
                        key={hourIndex}
                        className="h-12 border-b border-gray-200 dark:border-gray-700"
                      />
                    ))}

                    {/* Events */}
                    {dayEvents.map((event) => {
                      const position = getEventPosition(event.start_time, event.end_time);
                      if (!position) return null;

                      return (
                        <div
                          key={event.id}
                          className={`absolute left-0 right-0 rounded-sm border-l-4 ${getEventColor(
                            event.type
                          )} overflow-hidden px-1.5 py-1.5 text-xs text-white shadow-md transition-shadow hover:shadow-lg cursor-pointer min-w-0`}
                          style={{
                            top: position.top,
                            height: position.height,
                            minHeight: "36px",
                          }}
                          title={`${event.course_title} — ${event.start_time}–${event.end_time} — ${event.room || ""} — ${event.instructor}`}
                        >
                          <div className="mb-0.5 line-clamp-2 break-words font-bold leading-tight">
                            {event.course_title || event.class_code}
                          </div>
                          <div className="text-[10px] leading-tight opacity-95">
                            {event.start_time} – {event.end_time}
                          </div>
                          <div className="truncate text-[10px] leading-tight opacity-95" title={event.instructor}>{event.instructor}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
